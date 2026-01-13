# Claude Delegator Multi

Multi-provider AI expert delegation for Claude Code. Delegate complex tasks to 10 specialized AI experts running on OpenAI Codex, Google Gemini, or xAI Grok.

## Attribution

This project is built upon and extends [claude-delegator](https://github.com/jarrodwatts/claude-delegator) by **Jarrod Watts**. The original project pioneered AI expert delegation within Claude Code using OpenAI Codex. We are grateful for Jarrod's open-source contribution which served as the foundation and inspiration for this multi-provider extension.

**Original Project**: [github.com/jarrodwatts/claude-delegator](https://github.com/jarrodwatts/claude-delegator)

## What's New in Multi

| Feature | Original | Multi |
|---------|----------|-------|
| Providers | OpenAI Codex only | Codex + Gemini + Grok |
| Experts | 5 experts | 10 experts |
| Selection | Automatic routing | Manual selection with full control |
| Visual Analysis | Not supported | Images, screenshots, URLs |
| Setup | Manual configuration | Guided wizard |

## Features

- **10 Specialized AI Experts** - Architect, Code Reviewer, Security Analyst, Plan Reviewer, Scope Analyst, Web Designer, Website Developer, Documentation Expert, Rapid Prototyper, Bug Fixer
- **3 AI Providers** - OpenAI Codex (GPT-5.2), Google Gemini 3 Pro, xAI Grok Code Fast-1
- **Manual Selection** - You choose the expert and provider for each task
- **Cost Transparency** - See estimated costs before each delegation
- **Visual Analysis** - Web Designer expert can analyze images and reference URLs
- **Guided Setup** - Interactive wizard to configure API keys and providers

## Quick Start

### 1. Install

```bash
cd claude-delegator-multi
npm install
cd servers && npm install && npm run build
```

### 2. Setup Providers

Run the setup wizard in Claude Code:

```
/delegator:setup
```

This guides you through:
- Installing OpenAI Codex CLI (optional)
- Configuring Google Gemini API key (optional)
- Configuring xAI Grok API key (optional)

You only need **one provider** to get started.

### 3. Delegate Tasks

```
/delegator:delegate
```

Select an expert and provider:

```
EXPERTS                    PROVIDERS                  COST (input/output per 1M)
[1] Architect              [A] Codex (GPT-5.2)        $1.75 / $14.00
[2] Code Reviewer          [B] Gemini 3 Pro           $2.00 / $12.00
[3] Security Analyst       [C] Grok Code Fast-1       $0.20 / $1.50
[4] Plan Reviewer
[5] Scope Analyst
[6] Web Designer
[7] Website Developer
[8] Documentation Expert
[9] Rapid Prototyper
[0] Bug Fixer

Enter selection (e.g., "1A" = Architect on Codex):
```

## Experts

### Core Experts (All Providers)

| # | Expert | Description |
|---|--------|-------------|
| 1 | **Architect** | System design, architecture decisions, technical planning |
| 2 | **Code Reviewer** | Code quality, best practices, refactoring suggestions |
| 3 | **Security Analyst** | Security vulnerabilities, OWASP compliance, threat modeling |
| 4 | **Plan Reviewer** | Implementation plan validation, gap analysis |
| 5 | **Scope Analyst** | Requirement analysis, effort estimation, risk assessment |

### Visual & Web Experts (Gemini Recommended)

| # | Expert | Description |
|---|--------|-------------|
| 6 | **Web Designer** | UI/UX design, visual analysis, design systems |
| 7 | **Website Developer** | Frontend implementation, responsive design, accessibility |

### Documentation Expert (Gemini Recommended)

| # | Expert | Description |
|---|--------|-------------|
| 8 | **Documentation Expert** | API docs, technical writing, README generation |

### Rapid Development Experts (Grok Recommended)

| # | Expert | Description |
|---|--------|-------------|
| 9 | **Rapid Prototyper** | Quick MVPs, proof-of-concepts, speed-focused development |
| 0 | **Bug Fixer** | Fast debugging, error resolution, hot fixes |

## Providers

### OpenAI Codex (Option A)

- **Model**: GPT-5.2
- **Pricing**: $1.75 input / $14.00 output per 1M tokens
- **Setup**: Install Codex CLI with `npm install -g @openai/codex`
- **Best For**: Complex architecture, security analysis

### Google Gemini (Option B)

- **Model**: Gemini 3 Pro
- **Pricing**: $2.00 input / $12.00 output per 1M tokens
- **Setup**: Get API key from [Google AI Studio](https://aistudio.google.com/)
- **Best For**: Visual analysis, documentation, web design

### xAI Grok (Option C)

- **Model**: Grok Code Fast-1
- **Pricing**: $0.20 input / $1.50 output per 1M tokens
- **Setup**: Get API key from [xAI Console](https://console.x.ai/)
- **Best For**: Rapid prototyping, bug fixes, cost-sensitive tasks

## Delegation Format

When delegating, structure your request with these sections:

```markdown
## TASK
What you want the expert to do

## EXPECTED OUTCOME
What success looks like

## CONTEXT
Relevant files, architecture, constraints

## CONSTRAINTS
Limitations, requirements, non-negotiables

## MUST DO
Required actions or inclusions

## MUST NOT DO
Prohibited actions or patterns

## OUTPUT FORMAT
How you want the response structured
```

## Commands

| Command | Description |
|---------|-------------|
| `/delegator:setup` | Guided provider configuration wizard |
| `/delegator:delegate` | Start a new delegation with expert/provider selection |
| `/delegator:status` | Check configured providers and their status |
| `/delegator:uninstall` | Remove delegator configuration (preserves API keys) |

## Project Structure

```
claude-delegator-multi/
├── servers/                  # MCP server implementations
│   ├── shared/
│   │   └── mcp-base.ts       # Base server class
│   ├── codex-server.ts       # OpenAI Codex integration
│   ├── gemini-server.ts      # Google Gemini integration
│   └── grok-server.ts        # xAI Grok integration
├── prompts/                  # Expert system prompts
│   ├── architect.md
│   ├── code-reviewer.md
│   ├── security-analyst.md
│   ├── plan-reviewer.md
│   ├── scope-analyst.md
│   ├── web-designer.md
│   ├── website-developer.md
│   ├── documentation-expert.md
│   ├── rapid-prototyper.md
│   └── bug-fixer.md
├── rules/                    # Orchestration rules
│   ├── orchestration.md      # Core delegation logic
│   ├── manual-selection.md   # Selection interface
│   ├── delegation-format.md  # Prompt structure
│   └── expert-catalog.md     # Expert definitions
├── commands/                 # Slash commands
│   ├── setup.md
│   ├── delegate.md
│   ├── status.md
│   └── uninstall.md
├── config/                   # Configuration files
│   ├── providers.json
│   ├── experts.json
│   └── pricing.json
└── .claude-plugin/           # Plugin manifests
    ├── plugin.json
    └── marketplace.json
```

## How It Works

1. **Manual Selection**: You explicitly choose which expert and provider handles each task
2. **Stateless Delegation**: Each delegation includes full context - no session state required
3. **MCP Integration**: Providers communicate via Model Context Protocol servers
4. **Cost Estimation**: See estimated costs before confirming delegation

## Environment Variables

```bash
# Google Gemini (required for Gemini provider)
export GEMINI_API_KEY="your-api-key"

# xAI Grok (required for Grok provider)
export XAI_API_KEY="your-api-key"

# OpenAI Codex uses its own CLI authentication
# Run: codex auth
```

## Troubleshooting

### Provider not responding

1. Check API key is set: `/delegator:status`
2. Verify key is valid in provider's console
3. Check rate limits haven't been exceeded

### Codex CLI not found

```bash
npm install -g @openai/codex
codex auth
```

### Permission denied errors

Ensure MCP servers are built:

```bash
cd servers && npm run build
```

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details.

## Acknowledgments

- **[Jarrod Watts](https://github.com/jarrodwatts)** - Creator of the original [claude-delegator](https://github.com/jarrodwatts/claude-delegator) that inspired and served as the foundation for this project
- **Anthropic** - For Claude Code and the MCP protocol
- **OpenAI, Google, xAI** - For their powerful AI models
