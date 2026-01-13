---
name: setup
description: Guided setup wizard for claude-delegator-multi providers
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
timeout: 300000
---

# claude-delegator-multi Setup Wizard

Interactive setup to configure AI provider endpoints and coding models.

## Introduction

Display this welcome message:

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║   🚀 CLAUDE-DELEGATOR-MULTI SETUP                                     ║
║                                                                       ║
║   This wizard will help you configure:                                ║
║   • OpenAI Codex (GPT-5.2) - Complex reasoning, enterprise            ║
║   • Google Gemini (Gemini 3 Pro) - Large context, multimodal          ║
║   • xAI Grok (Grok Code Fast-1) - Speed, cost-effective               ║
║                                                                       ║
║   You can configure one, two, or all three providers.                 ║
║   Each unlocks different expert capabilities.                         ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## Step 1: Check Prerequisites

Run these checks:

```bash
# Check Node.js
node --version 2>/dev/null || echo "NODE_MISSING"
```

If Node.js is missing:
```
❌ Node.js not found. Please install Node.js 18+ first:
   https://nodejs.org/

Then run /delegator:setup again.
```

## Step 2: Provider Selection

Ask the user:

```
Which AI providers would you like to configure?

[1] OpenAI Codex only      - $1.75/$14.00 per 1M tokens
[2] Google Gemini only     - $2.00/$12.00 per 1M tokens
[3] xAI Grok only          - $0.20/$1.50 per 1M tokens (cheapest!)
[4] All three providers    - Recommended for full flexibility
[5] Custom selection       - Choose specific providers

Enter your choice (1-5):
```

## Step 3: OpenAI Codex Setup

If Codex selected, display:

```
┌─ OPENAI CODEX SETUP ─────────────────────────────────────────────────┐
│                                                                       │
│  Codex provides GPT-5.2-codex for complex coding tasks.              │
│                                                                       │
│  STEP 1: Install Codex CLI                                           │
│  Run: npm install -g @openai/codex                                   │
│                                                                       │
│  STEP 2: Authenticate                                                │
│  Run: codex login                                                    │
│  (Opens browser for OAuth - use your OpenAI account)                 │
│                                                                       │
│  STEP 3: Verify Installation                                         │
│  Run: codex --version                                                │
│                                                                       │
│  Pricing: $1.75/1M input, $14.00/1M output                          │
│  Context: 400K tokens                                                │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

Check installation:
```bash
which codex 2>/dev/null && codex --version || echo "CODEX_NOT_FOUND"
```

If not installed, offer to install:
```bash
npm install -g @openai/codex
```

Then guide through login:
```bash
codex login
```

## Step 4: Google Gemini Setup

If Gemini selected, display:

```
┌─ GOOGLE GEMINI SETUP ────────────────────────────────────────────────┐
│                                                                       │
│  Gemini provides access to Gemini 3 Pro with 2M token context.       │
│                                                                       │
│  STEP 1: Get API Key                                                 │
│  Visit: https://aistudio.google.com/apikey                           │
│  Create a new API key for your project.                              │
│                                                                       │
│  STEP 2: Set Environment Variable                                    │
│  Add to ~/.zshrc (or ~/.bashrc):                                     │
│                                                                       │
│    export GEMINI_API_KEY="your-api-key-here"                        │
│                                                                       │
│  STEP 3: Reload Shell                                                │
│  Run: source ~/.zshrc                                                │
│                                                                       │
│  Pricing: $2.00/1M input, $12.00/1M output                          │
│  Context: 2M tokens (largest available!)                             │
│  Free tier: 1,500 requests/day                                       │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

Ask for API key:
```
Enter your Gemini API Key (or press Enter to skip):
>
```

If provided, verify:
```bash
curl -s "https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}" | grep -q "models" && echo "GEMINI_OK" || echo "GEMINI_ERROR"
```

## Step 5: xAI Grok Setup

If Grok selected, display:

```
┌─ xAI GROK SETUP ─────────────────────────────────────────────────────┐
│                                                                       │
│  Grok provides fast, cost-effective coding with Grok Code Fast-1.    │
│                                                                       │
│  STEP 1: Get API Key                                                 │
│  Visit: https://console.x.ai/                                        │
│  Create an account and generate an API key.                          │
│                                                                       │
│  STEP 2: Set Environment Variable                                    │
│  Add to ~/.zshrc (or ~/.bashrc):                                     │
│                                                                       │
│    export XAI_API_KEY="xai-your-api-key-here"                       │
│                                                                       │
│  STEP 3: Reload Shell                                                │
│  Run: source ~/.zshrc                                                │
│                                                                       │
│  Pricing: $0.20/1M input, $1.50/1M output (BEST VALUE!)             │
│  Context: 256K tokens                                                │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

Ask for API key:
```
Enter your xAI API Key (or press Enter to skip):
>
```

If provided, verify:
```bash
curl -s "https://api.x.ai/v1/models" -H "Authorization: Bearer ${XAI_API_KEY}" | grep -q "grok" && echo "GROK_OK" || echo "GROK_ERROR"
```

## Step 6: Build MCP Servers

```bash
cd "${CLAUDE_PLUGIN_ROOT}/servers"
npm install
npm run build
```

## Step 7: Final Status Report

Display completion status:

```
╔═══════════════════════════════════════════════════════════════════════╗
║  ✅ SETUP COMPLETE                                                    ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  Providers Configured:                                                ║
║  ┌────────────────┬─────────────────┬──────────────────┐              ║
║  │ Provider       │ Model           │ Status           │              ║
║  ├────────────────┼─────────────────┼──────────────────┤              ║
║  │ OpenAI Codex   │ gpt-5.2-codex   │ ✓ Ready / ○ Skip │              ║
║  │ Google Gemini  │ gemini-3-pro    │ ✓ Ready / ○ Skip │              ║
║  │ xAI Grok       │ grok-code-fast-1│ ✓ Ready / ○ Skip │              ║
║  └────────────────┴─────────────────┴──────────────────┘              ║
║                                                                       ║
║  Available Experts (10):                                              ║
║  🏗️ Architect  📝 Code Reviewer  🔒 Security  📋 Plan Reviewer        ║
║  🎯 Scope  🎨 Web Designer  🌐 Website Dev  📚 Docs Expert            ║
║  ⚡ Rapid Prototyper  🐛 Bug Fixer                                    ║
║                                                                       ║
║  Quick Start:                                                         ║
║  • /delegate           - Open expert selection menu                   ║
║  • /delegator:status   - Check provider status                        ║
║  • "Ask the Architect" - Direct delegation                            ║
║                                                                       ║
║  ⚠️  Restart Claude Code to activate MCP servers.                     ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```
