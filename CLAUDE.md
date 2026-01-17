# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Bootstrap**: Read [PROJECT-GENOME.yaml](PROJECT-GENOME.yaml) first for instant codebase orientation.

## Project Overview

A toolkit repository for extending Claude Code capabilities. Contains reusable skills and a multi-provider AI expert delegation system.

## Common Commands

### Frontend Dashboard (claude-delegator-multi/frontend)
```bash
cd claude-delegator-multi/frontend
npm install
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint
```

### MCP Servers (claude-delegator-multi/servers)
```bash
cd claude-delegator-multi/servers
npm install
npm run build    # Compile TypeScript
npm run watch    # Watch mode
```

### Project Genome
```bash
python3 .claude/skills/project-genome/scripts/update_genome.py           # Update genome
python3 .claude/skills/project-genome/scripts/update_genome.py --validate # Validate token budget
```

### Skill Creation
```bash
python3 .claude/skills/skill-creator/scripts/init_skill.py <skill-name> --path .claude/skills/
python3 .claude/skills/skill-creator/scripts/package_skill.py <path/to/skill>
```

## Architecture

```
Claude Code
    │
    ├── Skills (.claude/skills/)
    │   └── Self-contained packages with SKILL.md entry points
    │       Each skill: SKILL.md + optional scripts/, references/, assets/
    │
    └── Delegator Plugin (claude-delegator-multi/)
        ├── MCP Servers (servers/) - Codex, Gemini, Grok providers
        ├── Expert Prompts (prompts/) - 10 specialized AI experts
        ├── Frontend (frontend/) - Next.js 15 dashboard
        └── Commands (commands/) - /delegate, /setup, /status
```

### Key Integration Points

- **Skills trigger via YAML frontmatter**: `name` and `description` fields determine when skills activate
- **MCP servers extend mcp-base.ts**: Shared base class in `servers/shared/mcp-base.ts`
- **Expert selection is manual**: User chooses expert + provider combination (e.g., "1A" = Architect on Codex)
- **Frontend uses IndexedDB**: Dexie.js for local persistence, Zustand for state

## Available Skills

| Skill | Purpose | Trigger |
|-------|---------|---------|
| ai-api-integrations | Multi-provider AI API guidance (OpenAI, Anthropic, Google, xAI, Supabase, Clerk) | AI API integration tasks |
| claude-agent-builder-typescript | Build production Claude Agent SDK agents | Agent SDK development |
| image-converter | Convert, resize, compress images (HEIC, PNG, JPEG, WebP, etc.) | Image manipulation, format conversion, batch processing |
| make-documents | Generate DOCX, PDF, PPTX, XLSX files | Document creation/editing |
| project-genome | Generate/update PROJECT-GENOME.yaml | Codebase orientation |
| react-best-practices | React/Next.js performance optimization (45 rules from Vercel) | React component writing, reviewing, refactoring |
| skill-creator | Create new Claude Code skills | Skill development |
| web-design-guidelines | UI code review for Web Interface Guidelines compliance | "review my UI", "check accessibility", "audit design" |

## Delegator Experts

10 experts available across 3 providers (Codex, Gemini, Grok):
- **Core**: Architect, Code Reviewer, Security Analyst, Plan Reviewer, Scope Analyst
- **Visual/Web** (Gemini recommended): Web Designer, Website Developer
- **Documentation** (Gemini recommended): Documentation Expert
- **Rapid** (Grok recommended): Rapid Prototyper, Bug Fixer

## Environment Variables

```bash
GEMINI_API_KEY="..."  # Google Gemini provider
XAI_API_KEY="..."     # xAI Grok provider
# Codex uses CLI auth: codex auth
```
