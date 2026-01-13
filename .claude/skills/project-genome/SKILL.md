---
name: project-genome
description: "Generates and maintains PROJECT-GENOME.yaml - a token-efficient bootstrap file for AI agents to quickly understand codebase structure, architecture, and navigation. Use when: (1) Initializing a new project for Claude Code, (2) Agent needs rapid codebase orientation, (3) Updating genome after major changes, (4) Setting up CI/CD for auto-generation, (5) Creating semantic maps for agent navigation. CRITICAL: This skill must run BEFORE reading PROJECT-GENOME.yaml to ensure freshness."
---

# Project Genome

Generate and maintain a comprehensive (<5k tokens) YAML bootstrap file that gives AI agents instant codebase understanding.

## CRITICAL: Pre-Read Protocol

**Before reading PROJECT-GENOME.yaml, ALWAYS execute this skill first.**

This ensures:
1. Genome is fresh (skills_map current, file_structure accurate)
2. CLAUDE.md properly references genome at top
3. New skills are discovered and added to skills_map

### Pre-Read Checklist (Execute Every Time)

```bash
# 1. Update genome with latest changes
python3 .claude/skills/project-genome/scripts/update_genome.py

# 2. Validate genome is under token budget
python3 .claude/skills/project-genome/scripts/update_genome.py --validate
```

### Self-Verification: CLAUDE.md Integration

After updating, verify CLAUDE.md contains:
1. **Line 3**: `> **Bootstrap**: Read [PROJECT-GENOME.yaml]...` reference
2. **Key Rules section**: Rule about refreshing genome before reading
3. **Skills table**: `project-genome` skill listed with trigger

If any missing, auto-fix by reading CLAUDE.md and adding required sections.

## Core Concept

PROJECT-GENOME.yaml is a **seed file**, not a full system. It provides:
- Instant project orientation (purpose, stack, structure)
- Semantic navigation (modules, key functions, dependencies)
- Agent-specific hints for efficient exploration
- Links to deeper resources (not duplicated content)

## When to Use

| Action | Trigger |
|--------|---------|
| **Generate** | New project setup, `/init`, "create genome" |
| **Update** | Major refactor, new modules, architecture changes |
| **Read** | Start of any coding session (automatic) |
| **Validate** | Before commits affecting structure |

## Genome Structure (YAML)

```yaml
project_name: "Project Name"
last_updated: "2026-01-12T06:30:00Z"  # ISO timestamp

purpose:
  summary: "Brief: Business goal, key features, users. <100 words."
  tech_stack: ["React", "Node.js", "PostgreSQL"]

repo_info:
  url: "https://github.com/org/project"
  branches: {main: "Production", dev: "Development"}
  ci_cd: "GitHub Actions"

file_structure:
  tree: |
    project-root/
    ├── src/           # Core logic
    ├── docs/          # Documentation
    └── tests/         # Test suites
  total_files: 42

architecture:
  overview: "High-level C4 context summary"
  patterns: ["MVC", "Event-driven"]
  diagram: |
    graph TD
    A[User] --> B[App]
    B --> C[API]

semantic_map:  # Compressed JSON for agent navigation
  modules:
    auth: {functions: ["login", "validateToken"], deps: ["jwt"]}
    payments: {functions: ["processCharge"], deps: ["stripe"]}
  flows:
    user_signup: "auth -> db -> email"

navigation_hints:
  - "Payment logic: src/services/payments, key fn: processCharge"
  - "DB schema: docs/schema.sql"
  - "Skills: .claude/skills/, use /skill-creator for new ones"

skills_map:
  ai-api-integrations: "AI model APIs, pricing, Supabase, Clerk"
  construction-budget-generator: "Excel renovation budgets"
  design-contract-generator: "Word service contracts"
  lead-research-assistant: "Sales lead research"
  skill-creator: "Create new Claude skills"
  project-genome: "This file - codebase bootstrap"
```

## Generate Genome

**Option 1: Run script**
```bash
python .claude/skills/project-genome/scripts/update_genome.py
```

**Option 2: Manual creation**
1. Copy template above to `PROJECT-GENOME.yaml` in repo root
2. Fill `purpose`, `repo_info` manually
3. Run `tree -a -I '.git|node_modules' > temp.txt` for structure
4. List top 5-10 modules in `semantic_map`
5. Add 3-5 navigation hints for common tasks

## Update Workflow

### When to Update
- **Always**: After adding new modules/services
- **Always**: After architecture changes
- **Quarterly**: Validate and prune for leanness

### Auto-Update Options

**Git Hook** (`.git/hooks/pre-commit`):
```bash
python .claude/skills/project-genome/scripts/update_genome.py
git add PROJECT-GENOME.yaml
```

**GitHub Actions** (`.github/workflows/update-genome.yaml`):
```yaml
name: Update Project Genome
on: [push]
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - run: pip install pyyaml
    - run: python .claude/skills/project-genome/scripts/update_genome.py
    - run: |
        git config user.name "GitHub Actions"
        git add PROJECT-GENOME.yaml
        git commit -m "Auto-update Project Genome" || echo "No changes"
        git push
```

## Integration with CLAUDE.md

CLAUDE.md should always reference PROJECT-GENOME.yaml at the top:

```markdown
# Project Name

> **Bootstrap**: Read [PROJECT-GENOME.yaml](PROJECT-GENOME.yaml) first for instant codebase orientation.

## Available Skills
[skills_map from genome]
```

## Token Budget Guidelines

| Section | Target | Notes |
|---------|--------|-------|
| purpose | 100-200 | Detailed summary with key features |
| file_structure | 300-600 | Top 3 levels, include key subdirectories |
| architecture | 200-400 | C4 context + key patterns, include diagram |
| semantic_map | 600-1200 | All major modules, key functions, dependencies |
| navigation_hints | 100-200 | 5-10 actionable prompts with file paths |
| skills_map | 200-400 | All skills with detailed descriptions |
| **Total** | **<4500** | Leave headroom for YAML syntax |

## Anti-Patterns

- **Duplicating README** - Genome is seed, not docs
- **Full code snippets** - Use function names, not implementations
- **Listing all files** - Top-level structure only
- **ADR content** - Link to docs/, don't inline
- **Updating every commit** - Major changes only
