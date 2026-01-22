#!/usr/bin/env python3
"""
Project Genome Updater - Auto-generates/updates PROJECT-GENOME.yaml

Updates dynamic sections (file_structure, semantic_map, documentation_map)
while preserving manual sections (purpose, navigation_hints, authoritative docs).

Usage:
    python update_genome.py                    # Update existing or create new
    python update_genome.py --init             # Force fresh creation
    python update_genome.py --validate         # Validate only, no changes
    python update_genome.py --discover-docs    # Discover docs for AI analysis
    python update_genome.py --review-docs      # Output pending docs for review

Requires: pyyaml (pip install pyyaml)
"""

import os
import sys
import json
import re
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path

try:
    import yaml
except ImportError:
    print("Error: pyyaml required. Install with: pip install pyyaml")
    sys.exit(1)

# Configuration
TOKEN_BUDGET_LIMIT = 5000  # Maximum token budget for PROJECT-GENOME.yaml
DOCS_PENDING_FILE = "docs_pending_analysis.json"

# Auto-skip patterns for ephemeral documentation
AUTO_SKIP_PATTERNS = [
    r'.*/archive/.*',           # Archive directories
    r'.*/old/.*',               # Old directories
    r'.*/deprecated/.*',        # Deprecated directories
    r'.*debug.*\.md$',          # Debug files
    r'.*debugging.*\.md$',      # Debugging files
    r'.*scratch.*\.md$',        # Scratch files
    r'.*temp.*\.md$',           # Temp files
    r'.*wip.*\.md$',            # Work in progress
    r'.*draft.*\.md$',          # Draft files
    r'.*notes\.md$',            # Notes files (standalone)
    r'.*TODO.*\.md$',           # TODO files
]

# Patterns that suggest authoritative documentation
AUTHORITATIVE_PATTERNS = {
    r'.*ARCHITECTURE.*\.md$': ('system_architecture', 0.85),
    r'.*CLAUDE\.md$': ('component_guide', 0.90),
    r'.*/system-docs/.*\.md$': ('system_architecture', 0.85),
    r'.*API.*\.md$': ('api_reference', 0.80),
    r'.*GUIDE.*\.md$': ('component_guide', 0.75),
    r'.*README\.md$': ('overview', 0.60),
    r'.*(TEST|QA).*PLAN.*\.md$': ('testing', 0.70),
    r'.*MIGRATION.*\.md$': ('migrations', 0.70),
}

# Patterns that suggest ephemeral documentation
EPHEMERAL_PATTERNS = {
    r'.*PLAN.*\.md$': ('implementation_plan', 0.50),
    r'.*-\d{8}.*\.md$': ('dated_plan', 0.40),  # Files with dates like -20260122
    r'.*_\d{8}.*\.md$': ('dated_plan', 0.40),
}


def find_repo_root() -> Path:
    """Find the repository root by looking for .git directory."""
    current = Path.cwd()
    while current != current.parent:
        if (current / ".git").exists():
            return current
        current = current.parent
    return Path.cwd()


def should_ignore_path(path: Path) -> bool:
    """Check if path should be ignored for documentation scanning."""
    ignore_dirs = {
        '.git', 'node_modules', '__pycache__', '.next', 'dist', 'build',
        '.expo', '.vercel', 'coverage', '.nyc_output', 'vendor',
        'generated-thumbnails', 'evaluation-results', 'reports',
        'test-results', 'backups',
        # Third-party/dependency directories
        'Pods', 'ios/Pods', 'android/build', '.gradle',
        'DerivedData', 'xcuserdata', '.idea',
        # Claude Code skill internals (not project docs)
        'skills',
    }

    parts = path.parts
    # Special handling: allow .claude/vibecodeapp-docs but exclude .claude/skills
    path_str = str(path)
    if '.claude/skills/' in path_str:
        return True

    return any(part in ignore_dirs for part in parts)


def extract_date_from_filename(filename: str) -> datetime | None:
    """Extract date from filename if present (e.g., PLAN_20260122.md)."""
    # Match patterns like 20260122, 2026-01-22, etc.
    patterns = [
        r'(\d{4})(\d{2})(\d{2})',      # 20260122
        r'(\d{4})-(\d{2})-(\d{2})',    # 2026-01-22
        r'(\d{4})_(\d{2})_(\d{2})',    # 2026_01_22
    ]

    for pattern in patterns:
        match = re.search(pattern, filename)
        if match:
            try:
                year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
                return datetime(year, month, day)
            except ValueError:
                continue

    return None


def extract_first_heading(content: str) -> str:
    """Extract the first H1 heading from markdown content."""
    match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return ""


def check_auto_skip(path: str, filename: str, content: str, file_size: int, modified_date: datetime) -> tuple[bool, str]:
    """
    Check if a doc should be auto-skipped.
    Returns (should_skip, reason).
    """
    path_lower = path.lower()
    filename_lower = filename.lower()

    # Check path patterns
    for pattern in AUTO_SKIP_PATTERNS:
        if re.match(pattern, path_lower):
            return True, f"Path matches skip pattern: {pattern}"

    # Check file size (stub files)
    if file_size < 500:
        return True, "File too small (<500 bytes) - likely stub"

    # Check for dated files older than 60 days
    file_date = extract_date_from_filename(filename)
    if file_date:
        age_days = (datetime.now() - file_date).days
        if age_days > 60:
            return True, f"Dated file older than 60 days ({age_days} days old)"

    # Check content for informal markers
    first_line = content.split('\n')[0].lower() if content else ""
    if any(marker in first_line for marker in ['# notes', '# scratch', '# todo', '# draft', '# wip']):
        return True, "Content starts with informal marker (Notes/Scratch/TODO/Draft/WIP)"

    return False, ""


def classify_doc_by_pattern(path: str) -> tuple[str, float]:
    """
    Classify a document based on filename/path patterns.
    Returns (suggested_category, base_confidence).
    """
    path_lower = path.lower()

    # Check authoritative patterns first (higher priority)
    for pattern, (category, confidence) in AUTHORITATIVE_PATTERNS.items():
        if re.match(pattern, path_lower):
            return category, confidence

    # Check ephemeral patterns
    for pattern, (category, confidence) in EPHEMERAL_PATTERNS.items():
        if re.match(pattern, path_lower):
            return category, confidence

    return "uncategorized", 0.50


def discover_documentation(root_dir: Path) -> list[dict]:
    """
    Discover all markdown documentation in the repository.
    Returns list of doc metadata for AI analysis.
    """
    docs = []
    now = datetime.now()

    for md_file in root_dir.rglob('*.md'):
        # Skip ignored directories
        if should_ignore_path(md_file.relative_to(root_dir)):
            continue

        rel_path = str(md_file.relative_to(root_dir))

        try:
            stat = md_file.stat()
            modified = datetime.fromtimestamp(stat.st_mtime)
            file_size = stat.st_size

            # Read first 3000 chars for analysis
            content_preview = ""
            try:
                content_preview = md_file.read_text(errors='ignore')[:3000]
            except Exception:
                pass

            # Check auto-skip
            should_skip, skip_reason = check_auto_skip(
                rel_path,
                md_file.name,
                content_preview,
                file_size,
                modified
            )

            # Pattern-based classification
            suggested_category, base_confidence = classify_doc_by_pattern(rel_path)

            # Calculate freshness (days since modified)
            days_old = (now - modified).days

            docs.append({
                'path': rel_path,
                'filename': md_file.name,
                'modified': modified.isoformat(),
                'days_old': days_old,
                'size_bytes': file_size,
                'first_heading': extract_first_heading(content_preview),
                'content_preview': content_preview,
                'auto_skip': should_skip,
                'skip_reason': skip_reason if should_skip else None,
                'pattern_category': suggested_category,
                'pattern_confidence': base_confidence,
                'needs_ai_analysis': not should_skip,
            })

        except Exception as e:
            print(f"Warning: Could not process {rel_path}: {e}")
            continue

    return docs


def generate_file_tree(root_dir: Path, max_depth: int = 3) -> tuple[str, int]:
    """Generate simple indented file tree."""
    exclude_patterns = ".git|node_modules|__pycache__|.DS_Store|dist|build|.next"
    tree_output = _simple_tree(root_dir, max_depth, exclude_patterns.split("|"))

    # Count total files
    total_files = sum(
        len(files)
        for _, _, files in os.walk(root_dir)
        if not any(ex in _ for ex in exclude_patterns.split("|"))
    )

    return tree_output, total_files


def _simple_tree(root: Path, max_depth: int, exclude: list, depth: int = 0) -> str:
    """Generate simple indented tree structure."""
    if depth >= max_depth:
        return ""

    lines = []
    try:
        entries = sorted(root.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
    except PermissionError:
        return ""

    # Filter out excluded patterns
    entries = [e for e in entries if not any(ex in e.name for ex in exclude)]

    indent = "  " * depth
    for entry in entries:
        # Add trailing slash for directories
        name = f"{entry.name}/" if entry.is_dir() else entry.name
        lines.append(f"{indent}{name}")

        if entry.is_dir():
            subtree = _simple_tree(entry, max_depth, exclude, depth + 1)
            if subtree:
                lines.append(subtree)

    return "\n".join(filter(None, lines))


def discover_skills(skills_dir: Path) -> dict:
    """Discover Claude skills from .claude/skills/ directory."""
    skills_map = {}

    if not skills_dir.exists():
        return skills_map

    for skill_path in skills_dir.iterdir():
        if not skill_path.is_dir():
            continue

        skill_md = skill_path / "SKILL.md"
        if not skill_md.exists():
            continue

        # Parse YAML frontmatter
        content = skill_md.read_text()
        if content.startswith("---"):
            try:
                _, frontmatter, _ = content.split("---", 2)
                meta = yaml.safe_load(frontmatter)
                desc = meta.get("description", "")
                skills_map[skill_path.name] = {
                    "description": desc[:100] + "..." if len(desc) > 100 else desc,
                    "trigger": f"/{skill_path.name}"
                }
            except (ValueError, yaml.YAMLError):
                skills_map[skill_path.name] = {
                    "description": "Skill discovered",
                    "trigger": f"/{skill_path.name}"
                }

    return skills_map


def build_semantic_map(root_dir: Path) -> dict:
    """Build lightweight semantic map of key modules."""
    semantic = {
        "modules": {},
        "flows": {}
    }

    # Discover key directories
    src_patterns = ["src", "lib", "app", "components", "services", "api"]

    for pattern in src_patterns:
        module_path = root_dir / pattern
        if module_path.exists() and module_path.is_dir():
            # Get subdirectories as modules
            for subdir in module_path.iterdir():
                if subdir.is_dir() and not subdir.name.startswith("."):
                    semantic["modules"][subdir.name] = {
                        "path": str(subdir.relative_to(root_dir)),
                        "files": len(list(subdir.glob("*.*")))
                    }

    # Skills are a special module
    skills_dir = root_dir / ".claude" / "skills"
    if skills_dir.exists():
        semantic["modules"]["skills"] = {
            "path": ".claude/skills/",
            "contains": [d.name for d in skills_dir.iterdir() if d.is_dir()],
            "trigger": "/<skill-name>"
        }

    # Check for docs
    docs_dir = root_dir / "docs"
    if docs_dir.exists():
        semantic["modules"]["docs"] = {
            "path": "docs/",
            "files": [f.name for f in docs_dir.glob("*.md")]
        }

    return semantic


def get_recent_changes(root_dir: Path, num_commits: int = 5) -> str:
    """Extract and synthesize recent git commits into a concise summary."""
    try:
        result = subprocess.run(
            ["git", "log", f"-{num_commits}", "--pretty=format:%s"],
            cwd=root_dir,
            capture_output=True,
            text=True,
            check=True
        )

        commits = result.stdout.strip().split('\n')
        if not commits or commits == ['']:
            return "No recent commits"

        # Synthesize into categories
        categories = {
            "features": [],
            "fixes": [],
            "updates": [],
            "refactors": [],
            "other": []
        }

        for commit in commits:
            commit_lower = commit.lower()
            if any(word in commit_lower for word in ["add", "implement", "create", "new", "feat"]):
                categories["features"].append(commit)
            elif any(word in commit_lower for word in ["fix", "resolve", "correct"]):
                categories["fixes"].append(commit)
            elif any(word in commit_lower for word in ["update", "upgrade", "improve"]):
                categories["updates"].append(commit)
            elif any(word in commit_lower for word in ["refactor", "reorganize", "restructure"]):
                categories["refactors"].append(commit)
            else:
                categories["other"].append(commit)

        # Build concise summary
        summary_parts = []

        if categories["features"]:
            summary_parts.append(f"Features: {', '.join(categories['features'][:3])}")
        if categories["fixes"]:
            summary_parts.append(f"Fixes: {', '.join(categories['fixes'][:2])}")
        if categories["updates"]:
            summary_parts.append(f"Updates: {', '.join(categories['updates'][:2])}")
        if categories["refactors"]:
            summary_parts.append(f"Refactors: {', '.join(categories['refactors'][:2])}")
        if categories["other"] and len(summary_parts) < 3:
            summary_parts.append(f"Other: {', '.join(categories['other'][:2])}")

        return " | ".join(summary_parts) if summary_parts else commits[0]

    except (subprocess.CalledProcessError, FileNotFoundError):
        return "Git history unavailable"


def load_existing_genome(genome_path: Path) -> dict | None:
    """Load existing genome file if it exists."""
    if not genome_path.exists():
        return None

    try:
        return yaml.safe_load(genome_path.read_text())
    except yaml.YAMLError:
        return None


def get_existing_authoritative_paths(existing_genome: dict | None) -> set[str]:
    """Extract all paths from existing authoritative documentation."""
    if not existing_genome:
        return set()

    doc_map = existing_genome.get('documentation_map', {})
    authoritative = doc_map.get('authoritative', {})

    paths = set()
    for category_docs in authoritative.values():
        if isinstance(category_docs, list):
            for doc in category_docs:
                if isinstance(doc, dict) and 'path' in doc:
                    paths.add(doc['path'])

    return paths


def validate_authoritative_docs(root_dir: Path, existing_genome: dict | None) -> list[str]:
    """Check if authoritative docs still exist. Return list of missing paths."""
    if not existing_genome:
        return []

    doc_map = existing_genome.get('documentation_map', {})
    authoritative = doc_map.get('authoritative', {})

    missing = []
    for category_docs in authoritative.values():
        if isinstance(category_docs, list):
            for doc in category_docs:
                if isinstance(doc, dict) and 'path' in doc:
                    full_path = root_dir / doc['path']
                    if not full_path.exists():
                        missing.append(doc['path'])

    return missing


def merge_genome(existing: dict | None, updates: dict) -> dict:
    """Merge updates into existing genome, preserving manual sections."""
    if existing is None:
        return updates

    # Sections to preserve from existing (manual edits)
    preserve_keys = [
        "purpose",
        "architecture",
        "navigation_hints"
    ]

    merged = updates.copy()

    for key in preserve_keys:
        if key in existing and existing[key]:
            merged[key] = existing[key]

    # Special handling for documentation_map - preserve authoritative section
    if 'documentation_map' in existing:
        existing_doc_map = existing['documentation_map']
        if 'authoritative' in existing_doc_map:
            merged['documentation_map']['authoritative'] = existing_doc_map['authoritative']

    return merged


def build_documentation_map(docs: list, existing_genome: dict | None) -> dict:
    """
    Build the documentation_map section.
    Preserves authoritative docs from existing genome.
    """
    # Get existing authoritative section
    existing_authoritative = {}
    if existing_genome and 'documentation_map' in existing_genome:
        existing_authoritative = existing_genome['documentation_map'].get('authoritative', {})

    # Get paths already in authoritative
    authoritative_paths = get_existing_authoritative_paths(existing_genome)

    # Separate docs into categories
    auto_skipped = [d for d in docs if d['auto_skip']]
    needs_analysis = [d for d in docs if d['needs_ai_analysis'] and d['path'] not in authoritative_paths]

    # Find archived docs
    archived_docs = [d for d in docs if '/archive/' in d['path'].lower()]
    archive_dirs = set()
    for d in archived_docs:
        # Extract archive directory path
        parts = d['path'].split('/')
        for i, part in enumerate(parts):
            if part.lower() == 'archive':
                archive_dirs.add('/'.join(parts[:i+1]) + '/')
                break

    # Build discovered section (ephemeral docs)
    recent_plans = []
    for d in docs:
        if d['path'] in authoritative_paths:
            continue
        if d['auto_skip']:
            continue
        if d['pattern_category'] in ['implementation_plan', 'dated_plan']:
            recent_plans.append({
                'path': d['path'],
                'modified': d['modified'][:10],  # Just date
                'category': d['pattern_category'],
            })

    return {
        'authoritative': existing_authoritative if existing_authoritative else {
            'system_architecture': [],
            'api_reference': [],
            'component_guides': [],
            'testing': [],
        },
        'discovered': {
            'recent_plans': recent_plans[:10],  # Limit to 10 most recent
            'archived': {
                'directories': list(archive_dirs),
                'count': len(archived_docs),
            }
        },
        'pending_review': [],  # Will be populated by AI analysis
        '_meta': {
            'last_scan': datetime.now(timezone.utc).isoformat(),
            'total_docs_scanned': len(docs),
            'auto_skipped': len(auto_skipped),
            'needs_ai_analysis': len(needs_analysis),
            'missing_authoritative': [],
        }
    }


def generate_genome(root_dir: Path, force_new: bool = False) -> dict:
    """Generate a new PROJECT-GENOME.yaml structure."""
    genome_path = root_dir / "PROJECT-GENOME.yaml"
    existing = None if force_new else load_existing_genome(genome_path)

    # Generate dynamic sections
    tree_output, total_files = generate_file_tree(root_dir)
    skills_map = discover_skills(root_dir / ".claude" / "skills")
    semantic_map = build_semantic_map(root_dir)
    recent_changes = get_recent_changes(root_dir, num_commits=5)

    # Discover documentation
    docs = discover_documentation(root_dir)
    documentation_map = build_documentation_map(docs, existing)

    # Validate existing authoritative docs
    missing_auth = validate_authoritative_docs(root_dir, existing)
    if missing_auth:
        documentation_map['_meta']['missing_authoritative'] = missing_auth

    # Build new genome
    new_genome = {
        "project_name": root_dir.name,
        "last_updated": datetime.now(timezone.utc).isoformat(),

        "purpose": {
            "summary": "TODO: Brief project description (<100 words)",
            "tech_stack": []
        },

        "repo_info": {
            "branches": {"main": "Production"}
        },

        "file_structure": {
            "tree": tree_output,
            "total_files": total_files
        },

        "architecture": {
            "overview": "TODO: High-level architecture summary",
            "patterns": [],
            "diagram": "graph TD\n    A[User] --> B[App]"
        },

        "semantic_map": semantic_map,

        "navigation_hints": [
            "TODO: Add navigation hints for common agent tasks"
        ],

        "skills_map": skills_map,

        "documentation_map": documentation_map,

        "recent_changes": recent_changes
    }

    # Merge with existing to preserve manual edits
    return merge_genome(existing, new_genome)


def validate_genome(genome: dict) -> list[str]:
    """Validate genome structure and return list of issues."""
    issues = []

    required_keys = ["project_name", "purpose", "file_structure", "semantic_map"]
    for key in required_keys:
        if key not in genome:
            issues.append(f"Missing required key: {key}")

    # Check token budget (rough estimate)
    yaml_str = yaml.dump(genome, default_flow_style=False)
    estimated_tokens = len(yaml_str) // 4  # Rough estimate: 4 chars per token

    if estimated_tokens > TOKEN_BUDGET_LIMIT:
        issues.append(f"Genome exceeds token budget: ~{estimated_tokens} tokens (target: <{TOKEN_BUDGET_LIMIT})")

    # Check for TODO placeholders in purpose
    if genome.get('purpose', {}).get('summary', '').startswith('TODO'):
        issues.append("Purpose section contains TODO placeholder - fill in project summary")

    # Check for missing authoritative docs
    doc_map = genome.get('documentation_map', {})
    missing = doc_map.get('_meta', {}).get('missing_authoritative', [])
    if missing:
        issues.append(f"Missing authoritative docs: {', '.join(missing)}")

    return issues


def output_docs_for_analysis(root_dir: Path, genome: dict):
    """Output docs that need AI analysis to a JSON file."""
    docs = discover_documentation(root_dir)
    authoritative_paths = get_existing_authoritative_paths(genome)

    # Filter to docs needing analysis
    pending = []
    for d in docs:
        if d['auto_skip']:
            continue
        if d['path'] in authoritative_paths:
            continue

        pending.append({
            'path': d['path'],
            'filename': d['filename'],
            'modified': d['modified'],
            'days_old': d['days_old'],
            'size_bytes': d['size_bytes'],
            'first_heading': d['first_heading'],
            'pattern_category': d['pattern_category'],
            'pattern_confidence': d['pattern_confidence'],
            'needs_ai_analysis': True,
        })

    output_path = root_dir / DOCS_PENDING_FILE
    with open(output_path, 'w') as f:
        json.dump({
            'generated': datetime.now(timezone.utc).isoformat(),
            'total_docs': len(docs),
            'auto_skipped': len([d for d in docs if d['auto_skip']]),
            'already_authoritative': len(authoritative_paths),
            'pending_analysis': pending,
        }, f, indent=2)

    print(f"📄 Wrote {len(pending)} docs for AI analysis to {DOCS_PENDING_FILE}")
    return pending


def output_pending_review(root_dir: Path, genome: dict):
    """Output docs in pending_review for user confirmation."""
    doc_map = genome.get('documentation_map', {})
    pending = doc_map.get('pending_review', [])

    if not pending:
        print("No docs pending review.")
        print("Run standard update first to discover and analyze docs.")
        return

    print(f"\n📚 Documentation Review: {len(pending)} docs pending\n")
    print("=" * 60)

    for i, doc in enumerate(pending, 1):
        score = doc.get('importance_score', 0)
        category = doc.get('suggested_category', 'unknown')
        reasoning = doc.get('ai_reasoning', 'No analysis available')

        if score >= 0.85:
            print(f"\n⭐ RECOMMENDED ({i}/{len(pending)})")
        elif score >= 0.50:
            print(f"\n({i}/{len(pending)})")
        else:
            print(f"\n(Low score - {i}/{len(pending)})")

        print(f"   {doc['path']}")
        print(f"   Score: {score:.2f} | Category: {category}")
        print(f"   {reasoning}")
        print()

    print("=" * 60)
    print("\nTo promote docs to authoritative, the AI agent will prompt you")
    print("for each doc when running this skill interactively.")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Update PROJECT-GENOME.yaml")
    parser.add_argument("--init", action="store_true", help="Force fresh creation")
    parser.add_argument("--validate", action="store_true", help="Validate only")
    parser.add_argument("--discover-docs", action="store_true", help="Discover docs for AI analysis")
    parser.add_argument("--review-docs", action="store_true", help="Output pending docs for review")
    parser.add_argument("--path", type=str, help="Repository path (default: auto-detect)")
    args = parser.parse_args()

    # Find repo root
    root_dir = Path(args.path) if args.path else find_repo_root()
    genome_path = root_dir / "PROJECT-GENOME.yaml"

    print(f"📦 Project Genome Updater")
    print(f"   Repository: {root_dir}")

    # Determine mode
    existing_genome = load_existing_genome(genome_path)
    if existing_genome:
        print(f"   Mode: ITERATION (preserving existing genome)")
    else:
        print(f"   Mode: BOOTSTRAP (creating new genome)")
    print()

    if args.validate:
        if not genome_path.exists():
            print("❌ PROJECT-GENOME.yaml not found")
            sys.exit(1)

        genome = yaml.safe_load(genome_path.read_text())
        issues = validate_genome(genome)

        if issues:
            print("⚠️  Validation issues:")
            for issue in issues:
                print(f"   - {issue}")
            sys.exit(1)
        else:
            print("✅ Genome is valid")
            sys.exit(0)

    if args.discover_docs:
        # Just output docs for AI analysis
        genome = existing_genome or {}
        pending = output_docs_for_analysis(root_dir, genome)
        print(f"\n   Auto-skipped: {len(discover_documentation(root_dir)) - len(pending)} ephemeral docs")
        print(f"   Pending AI analysis: {len(pending)} docs")
        print(f"\nNext: AI agent will read {DOCS_PENDING_FILE} and analyze each doc.")
        sys.exit(0)

    if args.review_docs:
        if not existing_genome:
            print("❌ No existing genome. Run without --review-docs first.")
            sys.exit(1)
        output_pending_review(root_dir, existing_genome)
        sys.exit(0)

    # Generate/update genome
    genome = generate_genome(root_dir, force_new=args.init)

    # Validate
    issues = validate_genome(genome)
    if issues:
        print("⚠️  Warnings:")
        for issue in issues:
            print(f"   - {issue}")

    # Write genome with literal block scalar for tree
    def str_representer(dumper, data):
        if '\n' in data:
            return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
        return dumper.represent_scalar('tag:yaml.org,2002:str', data)

    yaml.add_representer(str, str_representer)

    with open(genome_path, "w") as f:
        yaml.dump(genome, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

    # Summary
    doc_map = genome.get('documentation_map', {})
    meta = doc_map.get('_meta', {})

    print(f"✅ {'Created' if args.init else 'Updated'} PROJECT-GENOME.yaml")
    print(f"   Skills discovered: {len(genome.get('skills_map', {}))}")
    print(f"   Total files: {genome.get('file_structure', {}).get('total_files', 'unknown')}")
    print()
    print(f"📚 Documentation Map:")
    print(f"   Total docs scanned: {meta.get('total_docs_scanned', 0)}")
    print(f"   Auto-skipped (ephemeral): {meta.get('auto_skipped', 0)}")
    print(f"   Needs AI analysis: {meta.get('needs_ai_analysis', 0)}")

    auth_count = sum(
        len(docs) for docs in doc_map.get('authoritative', {}).values()
        if isinstance(docs, list)
    )
    print(f"   Authoritative docs: {auth_count}")

    missing = meta.get('missing_authoritative', [])
    if missing:
        print(f"   ⚠️  Missing authoritative: {len(missing)}")
        for m in missing:
            print(f"      - {m}")

    # Output docs for AI analysis
    output_docs_for_analysis(root_dir, genome)

    # Estimate tokens
    yaml_str = yaml.dump(genome, default_flow_style=False)
    estimated_tokens = len(yaml_str) // 4
    print(f"\n   Estimated tokens: ~{estimated_tokens}")


if __name__ == "__main__":
    main()
