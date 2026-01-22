---
name: project-genome
description: "Run FIRST when starting work on any codebase. Creates PROJECT-GENOME.yaml with complete project map: architecture, file structure, key file paths, and authoritative documentation locations. One 4K token read replaces hours of exploratory searching. Refresh with /project-genome after major changes."
---

# Project Genome

Generate and maintain a comprehensive (<5k tokens) YAML bootstrap file that gives AI agents instant codebase understanding, including **AI-analyzed documentation mapping**.

## CRITICAL: Pre-Read Protocol

**Before reading PROJECT-GENOME.yaml, ALWAYS execute this skill first.**

This ensures:
1. Genome is fresh (skills_map current, file_structure accurate)
2. Documentation map is current (new docs discovered, stale docs flagged)
3. CLAUDE.md properly references genome at top
4. New skills are discovered and added to skills_map

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
- **Documentation map with AI-scored importance** (authoritative vs ephemeral)
- Agent-specific hints for efficient exploration
- Links to deeper resources (not duplicated content)

## When to Use

| Action | Trigger |
|--------|---------|
| **Generate** | New project setup, `/init`, "create genome" |
| **Update** | Major refactor, new modules, architecture changes |
| **Read** | Start of any coding session (automatic) |
| **Validate** | Before commits affecting structure |
| **Review Docs** | `--review-docs` to classify discovered documentation |

---

## Documentation Map Feature

The `documentation_map` section tracks all markdown documentation in the repo, distinguishing between **authoritative** (user-confirmed important) and **ephemeral** (temporary plans, working notes).

### Why This Matters

AI agents frequently generate temporary documentation:
- Implementation plans (`*_PLAN.md`)
- Debugging notes (`debugging-*.md`)
- Session-specific scratch files

These should NOT be treated as authoritative project documentation. The documentation map:
1. **Auto-discovers** all markdown files
2. **AI-analyzes** each for importance signals
3. **Auto-skips** low-quality/ephemeral docs
4. **Preserves** user-confirmed authoritative docs across updates

### Documentation Map Structure

```yaml
documentation_map:
  # User-confirmed authoritative docs (PRESERVED across updates)
  authoritative:
    system_architecture:
      - path: "docs/ARCHITECTURE.md"
        purpose: "High-level system design and component interactions"
        last_verified: "2026-01-22"
    api_reference:
      - path: "backend/API_ENDPOINTS.md"
        purpose: "REST API documentation with schemas"
    component_guides:
      - path: "backend/CLAUDE.md"
        purpose: "Backend development patterns"

  # Auto-discovered docs (REFRESHED on each update)
  discovered:
    recent_plans:
      - path: "docs/QA_PLAN_20260122.md"
        importance_score: 0.45
        category: "implementation_plan"
    archived:
      directory: "docs/archive/"
      count: 12

  # Docs needing user review (cleared after --review-docs)
  pending_review:
    - path: "docs/NEW_FEATURE_SPEC.md"
      importance_score: 0.78
      suggested_category: "system_architecture"
      ai_reasoning: "Well-structured spec with diagrams. Covers new subsystem."

  # Validation state
  _meta:
    last_scan: "2026-01-22T14:30:00Z"
    total_docs_scanned: 47
    auto_skipped: 23
    missing_authoritative: []
```

---

## AI Documentation Analysis

When this skill runs, the agent analyzes discovered markdown files to determine importance.

### Analysis Process

For each discovered `.md` file (read first 3000 chars):

1. **Evaluate Quality Signals (30% weight)**
   - Clear H1/H2 structure
   - Contains code blocks, diagrams, or tables
   - References specific files/functions in codebase
   - Professional/authoritative tone

2. **Evaluate Freshness Signals (25% weight)**
   - Modified within last 30 days
   - References files that still exist
   - No "TODO", "DRAFT", "WIP" markers in title
   - Current tech stack mentioned

3. **Evaluate Scope Signals (25% weight)**
   - Covers entire system/module vs single task
   - Located in structured docs directory
   - Has "Architecture", "Guide", "Reference" in name

4. **Evaluate Deprecation Signals (20% weight)**
   - Located in `/archive/` directory
   - Contains "deprecated", "outdated", "old" language
   - References removed features/files
   - Date in filename older than 30 days (e.g., `plan-20251201.md`)

### Importance Score Calculation

```
importance_score = (quality * 0.30) + (freshness * 0.25) + (scope * 0.25) + ((1 - deprecation) * 0.20)
```

### Auto-Skip Criteria (importance_score < 0.35)

Automatically skip (don't prompt user) for docs matching:
- Located in `/archive/`, `/old/`, `/deprecated/` directories
- Filename contains date older than 60 days
- Title contains "DRAFT", "WIP", "TODO", "SCRATCH", "NOTES" (informal)
- Less than 500 bytes (stub files)
- Filename pattern: `*-debug-*.md`, `*-test-*.md`, `debugging-*.md`
- Content starts with "# Notes" or "# Scratch"

### Category Assignment

| Score Range | Suggested Category |
|-------------|-------------------|
| >= 0.85 | `system_architecture` or `api_reference` (based on content) |
| 0.70 - 0.84 | `component_guide` or `testing` |
| 0.50 - 0.69 | `implementation_plan` |
| 0.35 - 0.49 | `working_notes` (ephemeral, not authoritative) |
| < 0.35 | Auto-skip (don't include in pending_review) |

---

## Execution Modes

### Mode 1: Standard Update (Default)

```bash
python3 .claude/skills/project-genome/scripts/update_genome.py
```

**What happens:**
1. Script discovers all markdown files
2. Script outputs `docs_pending_analysis.json`
3. **Agent reads each pending doc** (first 3000 chars)
4. **Agent calculates importance_score** for each
5. **Agent updates genome** with documentation_map

**Agent instructions for this mode:**

After running the script, if `docs_pending_analysis.json` exists:

```
1. Read docs_pending_analysis.json
2. For each doc with needs_analysis=true:
   a. Read the file (first 3000 chars)
   b. Evaluate: quality, freshness, scope, deprecation signals
   c. Calculate importance_score (0.0-1.0)
   d. Determine suggested_category
   e. Write 1-2 sentence reasoning
3. Update PROJECT-GENOME.yaml:
   - Preserve existing authoritative section
   - Update discovered section with scored docs
   - Add high-score docs (>=0.50) to pending_review
   - Auto-skip low-score docs (<0.35)
4. Delete docs_pending_analysis.json
5. Report summary to user
```

### Mode 2: Documentation Review

```bash
python3 .claude/skills/project-genome/scripts/update_genome.py --review-docs
```

**What happens:**
1. Script reads existing genome
2. Script outputs docs in `pending_review` for user confirmation
3. **Agent presents each doc to user** with AI analysis
4. **User confirms or skips** each doc
5. **Agent moves confirmed docs** to `authoritative` section

**Agent instructions for this mode:**

Present each pending doc to user:

```
For docs with importance_score >= 0.85 (RECOMMENDED):
  "⭐ RECOMMENDED: {path}
   AI Score: {score} | Suggested: {category}
   {ai_reasoning}

   Promote to authoritative? [Y/n]: "
   (Default YES - just press Enter to confirm)

For docs with score 0.50-0.84:
  "{path}
   AI Score: {score} | Suggested: {category}
   {ai_reasoning}

   Promote to authoritative? [y/n/skip]: "

For docs with score 0.35-0.49:
  "(Low score - likely ephemeral)
   {path} - Score: {score}
   {ai_reasoning}

   [Auto-skipping - press Enter to continue, or 'p' to promote anyway]: "
```

When user confirms a doc:
```
"Purpose (1 line) [{suggested_purpose}]: "
(User can press Enter to accept suggestion or type custom)
```

### Mode 3: Bootstrap (No Existing Genome)

When `PROJECT-GENOME.yaml` doesn't exist:

1. Run full discovery
2. ALL docs go to `pending_review` (nothing is authoritative yet)
3. Inform user: "No existing genome. Run `--review-docs` to classify documentation."

---

## Genome Structure (Complete YAML)

```yaml
project_name: "Project Name"
last_updated: "2026-01-22T06:30:00Z"

purpose:
  summary: "Brief: Business goal, key features, users. <100 words."
  tech_stack: ["React", "Node.js", "PostgreSQL"]

repo_info:
  branches: {main: "Production", dev: "Development"}

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

semantic_map:
  modules:
    auth: {path: "src/auth", files: 5}
    payments: {path: "src/payments", files: 3}
  flows: {}

navigation_hints:
  - "Payment logic: src/services/payments"
  - "DB schema: docs/schema.sql"
  - "Skills: .claude/skills/"

skills_map:
  skill-name:
    description: "What this skill does..."
    trigger: "/skill-name"

# NEW: Documentation map with AI analysis
documentation_map:
  authoritative:
    system_architecture: []
    api_reference: []
    component_guides: []
    testing: []
  discovered:
    recent_plans: []
    archived: {directory: "", count: 0}
  pending_review: []
  _meta:
    last_scan: ""
    total_docs_scanned: 0
    auto_skipped: 0
    missing_authoritative: []

recent_changes: "Auto-generated from last 5 git commits"
```

---

## Token Budget Guidelines

| Section | Target | Notes |
|---------|--------|-------|
| purpose | 100-200 | Detailed summary with key features |
| file_structure | 300-600 | Top 3 levels, include key subdirectories |
| architecture | 200-400 | C4 context + key patterns, include diagram |
| semantic_map | 400-800 | Major modules, key functions |
| navigation_hints | 100-200 | 5-10 actionable prompts with file paths |
| skills_map | 200-400 | All skills with descriptions |
| documentation_map | 400-600 | Authoritative docs with purposes |
| **Total** | **<5000** | Leave headroom for YAML syntax |

---

## Anti-Patterns

- **Duplicating README** - Genome is seed, not docs
- **Full code snippets** - Use function names, not implementations
- **Listing all files** - Top-level structure only
- **ADR content** - Link to docs/, don't inline
- **Updating every commit** - Major changes only
- **Including ephemeral docs in authoritative** - Only user-confirmed docs
- **Keeping stale pending_review** - Clear after each review session

---

## Example AI Analysis Output

When analyzing `monorepo-docs/system-docs/MESSAGE_HANDLING_ARCHITECTURE.md`:

```yaml
path: "monorepo-docs/system-docs/MESSAGE_HANDLING_ARCHITECTURE.md"
importance_score: 0.92
suggested_category: "system_architecture"
ai_reasoning: |
  High-quality architecture doc. Clear H1/H2 structure with Mermaid diagrams.
  Covers critical realtime messaging subsystem. Updated 2026-01-21.
  References active code: realtime-sync.ts, [threadId].tsx.
  Located in structured system-docs directory. No deprecation signals.
signals:
  quality: 0.95
  freshness: 0.90
  scope: 0.90
  deprecation: 0.05
```

When analyzing `monorepo-docs/debugging-carpet-issue.md`:

```yaml
path: "monorepo-docs/debugging-carpet-issue.md"
importance_score: 0.22
suggested_category: "auto_skip"
ai_reasoning: |
  Debugging notes from a specific session. Informal structure.
  Contains "debugging" in filename. Likely ephemeral working doc.
  Not suitable for authoritative documentation.
signals:
  quality: 0.30
  freshness: 0.40
  scope: 0.10
  deprecation: 0.20
auto_skip: true
skip_reason: "Filename pattern matches debugging-*.md"
```

---

## Integration with CLAUDE.md

After running this skill, CLAUDE.md should reference key authoritative docs:

```markdown
# Project Name

> **Bootstrap**: Read [PROJECT-GENOME.yaml](PROJECT-GENOME.yaml) first.

## Key Documentation

| Category | Authoritative Docs |
|----------|-------------------|
| Architecture | `system-docs/OVERVIEW.md`, `MESSAGE_HANDLING.md` |
| API | `BACKEND_API_COMPLETE.md` |
| Components | `backend/CLAUDE.md`, `mobile-app/CLAUDE.md` |

See `documentation_map` in PROJECT-GENOME.yaml for full list.
```
