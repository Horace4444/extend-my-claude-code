---
name: delegate
description: Open the expert selection menu to delegate a task
allowed-tools: Read, Bash
timeout: 60000
---

# Delegate to Expert

Present the manual selection interface for delegating tasks to AI experts.

## Display Selection Menu

```
┌─────────────────────────────────────────────────────────────────────┐
│  DELEGATE TO EXPERT                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SELECT EXPERT:                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  [1] 🏗️  Architect        - System design, tradeoffs, strategy      │
│  [2] 📝 Code Reviewer     - Code quality, bugs, improvements        │
│  [3] 🔒 Security Analyst  - Vulnerabilities, hardening              │
│  [4] 📋 Plan Reviewer     - Validate plans before execution         │
│  [5] 🎯 Scope Analyst     - Clarify requirements, boundaries        │
│  [6] 🎨 Web Designer      - UI/UX, visual design, mockups           │
│  [7] 🌐 Website Developer - Full-stack web, React, Next.js          │
│  [8] 📚 Docs Expert       - Technical documentation                 │
│  [9] ⚡ Rapid Prototyper  - Fast POCs, quick iterations             │
│  [0] 🐛 Bug Fixer         - Diagnose and fix bugs quickly           │
│                                                                     │
│  SELECT PROVIDER:                                                   │
│  ─────────────────────────────────────────────────────────────────  │
│  [A] Codex (GPT-5.2)     │ $1.75/$14.00  │ Best: Complex reasoning  │
│  [B] Gemini 3 Pro        │ $2.00/$12.00  │ Best: Large context      │
│  [C] Grok Code Fast-1    │ $0.20/$1.50   │ Best: Speed, low cost    │
│                                                                     │
│  Enter selection (e.g., "1A" = Architect on Codex):                │
│                                                                     │
│  Or describe your task and I'll help you choose.                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Provider Recommendations

| Expert | Recommended | Alternative | Reason |
|--------|-------------|-------------|--------|
| Architect | A (Codex) | B (Gemini) | Deep reasoning needed |
| Code Reviewer | A (Codex) | C (Grok) | Thorough analysis |
| Security | A (Codex) | - | Enterprise patterns |
| Plan Reviewer | A (Codex) | B (Gemini) | Comprehensive |
| Scope Analyst | A (Codex) | - | Detailed analysis |
| Web Designer | B (Gemini) | A (Codex) | Can analyze images |
| Website Dev | A (Codex) | B (Gemini) | Complex implementation |
| Docs Expert | B (Gemini) | A (Codex) | 2M context window |
| Rapid Prototyper | C (Grok) | B (Gemini) | Speed matters |
| Bug Fixer | C (Grok) | A (Codex) | Fast, cheap |

## Handling Selection

When user provides selection (e.g., "1A"):

1. Parse the selection:
   - First character: Expert (1-9, 0)
   - Second character: Provider (A, B, C)

2. Confirm:
   ```
   Delegating to Architect on Codex (gpt-5.2-codex)
   Estimated cost: ~$0.05 - $0.30

   What task would you like the Architect to help with?
   ```

3. Once task is provided:
   - Read the expert prompt: `prompts/[expert].md`
   - Build 7-section delegation prompt
   - Call the appropriate MCP tool
   - Synthesize and present response

## Quick Shortcuts

If user provides task with selection:
- "1A review my authentication design" → Architect on Codex
- "0C fix this null pointer error" → Bug Fixer on Grok
- "6B analyze this screenshot" → Web Designer on Gemini

## Cost Estimates

| Complexity | Codex | Gemini | Grok |
|------------|-------|--------|------|
| Simple (~2K tokens) | $0.03 | $0.03 | $0.003 |
| Medium (~10K tokens) | $0.15 | $0.12 | $0.015 |
| Complex (~30K tokens) | $0.45 | $0.36 | $0.045 |
