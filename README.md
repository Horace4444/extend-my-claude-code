# Extend My Claude Code

A public repository of tools, skills, and plugins that extend Claude Code capabilities. Use these resources in your own projects or contribute your own extensions for the community.

## Why This Repo Exists

Claude Code is powerful out of the box, but specialized workflows benefit from reusable tooling. This repository serves as:

1. **A skill library** - Pre-built skills for document generation, AI API integrations, agent building, and more
2. **A reference implementation** - Working examples of Claude Code plugins and MCP server patterns
3. **A starting point** - Copy what you need into your own projects and customize

The goal is to reduce duplication across projects. Instead of rebuilding the same PDF generation logic or API integration patterns, grab tested implementations from here.

## What's Included

### Skills (`.claude/skills/`)

| Skill | Description |
|-------|-------------|
| **ai-api-integrations** | Guidance for OpenAI, Anthropic, Google Gemini, xAI Grok, Supabase, and Clerk |
| **claude-agent-builder-typescript** | Build production agents with Claude Agent SDK |
| **image-converter** | Convert, resize, compress images (HEIC, PNG, JPEG, WebP, AVIF, GIF, TIFF, BMP) |
| **make-documents** | Generate DOCX, PDF, PPTX, XLSX files with proper formatting |
| **project-genome** | Generate PROJECT-GENOME.yaml for codebase orientation |
| **react-best-practices** | React/Next.js performance optimization (45 rules from Vercel Engineering) |
| **skill-creator** | Guide for creating new Claude Code skills |
| **web-design-guidelines** | UI code review for Web Interface Guidelines compliance (accessibility, UX) |

### Claude Delegator Multi (`claude-delegator-multi/`)

A multi-provider AI expert delegation system with 10 specialized experts running on OpenAI Codex, Google Gemini, or xAI Grok. Includes MCP servers, expert prompts, and a Next.js dashboard.

## Quick Start

### Option 1: Clone the Entire Repo

```bash
git clone https://github.com/Horace4444/extend-my-claude-code.git
cd extend-my-claude-code
```

### Option 2: Download Specific Skills

Copy individual skills directly into your project's `.claude/skills/` directory:

```bash
# Create skills directory if it doesn't exist
mkdir -p your-project/.claude/skills

# Copy a specific skill (example: make-documents)
cp -r extend-my-claude-code/.claude/skills/make-documents your-project/.claude/skills/

# Or copy all skills
cp -r extend-my-claude-code/.claude/skills/* your-project/.claude/skills/
```

### Option 3: Cherry-Pick Files via GitHub

1. Navigate to the file or folder you want on GitHub
2. Click "Download" or copy the raw content
3. Place in the corresponding location in your project

## Using Skills in Your Project

Once copied, skills activate automatically based on their trigger descriptions. Each skill has a `SKILL.md` file that defines when it should be used.

**Skill structure:**
```
your-project/
├── .claude/
│   └── skills/
│       └── skill-name/
│           ├── SKILL.md        # Entry point (required)
│           ├── scripts/        # Executable code (optional)
│           ├── references/     # Documentation (optional)
│           └── assets/         # Templates, images (optional)
```

**Example: Adding document generation to your project**
```bash
cp -r extend-my-claude-code/.claude/skills/make-documents your-project/.claude/skills/
```

Now Claude Code in your project can generate Word, PDF, PowerPoint, and Excel files.

## Using the Delegator Plugin

The delegator requires additional setup:

```bash
# Copy the plugin
cp -r extend-my-claude-code/claude-delegator-multi your-project/

# Install dependencies
cd your-project/claude-delegator-multi
npm install

# Build MCP servers
cd servers && npm install && npm run build

# Configure providers (in Claude Code)
/delegator:setup
```

## Contributing

Contributions welcome. To add a new skill:

1. Use the skill-creator: Run `/skill-creator` in Claude Code
2. Follow the skill structure conventions
3. Test thoroughly in a real project
4. Submit a pull request

## Project Structure

```
extend-my-claude-code/
├── .claude/
│   └── skills/                 # Reusable Claude Code skills
│       ├── ai-api-integrations/
│       ├── claude-agent-builder-typescript/
│       ├── image-converter/
│       ├── make-documents/
│       ├── project-genome/
│       ├── react-best-practices/
│       ├── skill-creator/
│       └── web-design-guidelines/
├── claude-delegator-multi/     # Multi-provider delegation plugin
│   ├── commands/               # Slash commands
│   ├── config/                 # Expert/provider configs
│   ├── frontend/               # Next.js dashboard
│   ├── prompts/                # Expert system prompts
│   ├── rules/                  # Orchestration rules
│   └── servers/                # MCP server implementations
├── CLAUDE.md                   # Claude Code guidance
├── PROJECT-GENOME.yaml         # Codebase bootstrap for AI agents
└── README.md
```

## License

MIT License - use freely in personal and commercial projects.

## Acknowledgments

- **[Jarrod Watts](https://github.com/jarrodwatts)** - Creator of the original [claude-delegator](https://github.com/jarrodwatts/claude-delegator) that inspired the multi-provider extension
- **Anthropic** - For Claude Code and the MCP protocol
