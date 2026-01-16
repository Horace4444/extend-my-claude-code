#!/usr/bin/env python3
"""
Project Genome Updater - Auto-generates/updates PROJECT-GENOME.yaml

Updates dynamic sections (file_structure, semantic_map) while preserving
manual sections (purpose, navigation_hints).

Usage:
    python update_genome.py                    # Update existing or create new
    python update_genome.py --init             # Force fresh creation
    python update_genome.py --validate         # Validate only, no changes

Requires: pyyaml (pip install pyyaml)
Optional: tree-sitter for AST-based semantic map (pip install tree-sitter)
"""

import os
import sys
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:
    print("Error: pyyaml required. Install with: pip install pyyaml")
    sys.exit(1)

# Configuration
TOKEN_BUDGET_LIMIT = 5000  # Maximum token budget for PROJECT-GENOME.yaml


def find_repo_root() -> Path:
    """Find the repository root by looking for .git directory."""
    current = Path.cwd()
    while current != current.parent:
        if (current / ".git").exists():
            return current
        current = current.parent
    return Path.cwd()


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
                skills_map[skill_path.name] = {
                    "description": meta.get("description", "")[:100] + "..." if len(meta.get("description", "")) > 100 else meta.get("description", ""),
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
    """
    Extract and synthesize recent git commits into a concise summary.

    Args:
        root_dir: Repository root directory
        num_commits: Number of recent commits to analyze (default: 5)

    Returns:
        Synthesized summary of recent changes
    """
    try:
        # Get recent commit messages
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
            if any(word in commit_lower for word in ["add", "implement", "create", "new"]):
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

    return merged


def generate_genome(root_dir: Path, force_new: bool = False) -> dict:
    """Generate a new PROJECT-GENOME.yaml structure."""
    genome_path = root_dir / "PROJECT-GENOME.yaml"
    existing = None if force_new else load_existing_genome(genome_path)

    # Generate dynamic sections
    tree_output, total_files = generate_file_tree(root_dir)
    skills_map = discover_skills(root_dir / ".claude" / "skills")
    semantic_map = build_semantic_map(root_dir)
    recent_changes = get_recent_changes(root_dir, num_commits=5)

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

    # Check for TODO placeholders
    if "TODO" in yaml_str:
        issues.append("Genome contains TODO placeholders - fill in manual sections")

    return issues


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Update PROJECT-GENOME.yaml")
    parser.add_argument("--init", action="store_true", help="Force fresh creation")
    parser.add_argument("--validate", action="store_true", help="Validate only")
    parser.add_argument("--path", type=str, help="Repository path (default: auto-detect)")
    args = parser.parse_args()

    # Find repo root
    root_dir = Path(args.path) if args.path else find_repo_root()
    genome_path = root_dir / "PROJECT-GENOME.yaml"

    print(f"📦 Project Genome Updater")
    print(f"   Repository: {root_dir}")
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

    print(f"✅ {'Created' if args.init else 'Updated'} PROJECT-GENOME.yaml")
    print(f"   Skills discovered: {len(genome.get('skills_map', {}))}")
    print(f"   Total files: {genome.get('file_structure', {}).get('total_files', 'unknown')}")

    # Estimate tokens
    yaml_str = yaml.dump(genome, default_flow_style=False)
    estimated_tokens = len(yaml_str) // 4
    print(f"   Estimated tokens: ~{estimated_tokens}")


if __name__ == "__main__":
    main()
