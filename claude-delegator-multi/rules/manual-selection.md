# Manual Expert Selection

## Core Principle

**Never auto-select.** Always present the user with clear options and let them choose.

## When to Present Selection

Present the selection interface when:
1. User explicitly requests delegation ("ask GPT", "use Gemini", "/delegate")
2. Task would benefit from expert input AND user hasn't selected yet
3. User says "help me decide" or asks for expert opinion

## Selection Interface Format

### Standard Selection Menu

```
┌─────────────────────────────────────────────────────────────────────┐
│  DELEGATE TO EXPERT                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Task: "[user's request summarized in one line]"                    │
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
│  [B] Gemini 3 Pro        │ $2.00/$12.00  │ Best: Large context, images│
│  [C] Grok Code Fast-1    │ $0.20/$1.50   │ Best: Speed, low cost    │
│                                                                     │
│  Enter selection (e.g., "1A" = Architect on Codex):                │
│                                                                     │
│  Estimated cost for this task: ~$X.XX - $X.XX                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Compact Selection (for follow-ups)

```
Which expert/provider? (e.g., "1A" for Architect on Codex)
Experts: 1=Architect, 2=CodeReview, 3=Security, 4=Plan, 5=Scope,
         6=WebDesign, 7=WebDev, 8=Docs, 9=Prototype, 0=BugFix
Providers: A=Codex, B=Gemini, C=Grok
```

## Quick Selection Shortcuts

Allow users to skip the menu with explicit requests:

| User Says | Interpretation |
|-----------|----------------|
| "Ask the Architect on Codex about..." | → 1A - Direct delegation |
| "Have Grok fix this bug" | → 0C - Bug Fixer on Grok |
| "Gemini, review this code" | → 2B - Code Reviewer on Gemini |
| "Quick prototype with Grok" | → 9C - Rapid Prototyper on Grok |
| "Security review on Codex" | → 3A - Security Analyst on Codex |

## After Selection

Once user selects (e.g., "1A"):

1. **Confirm selection**:
   ```
   Delegating to Architect on Codex (gpt-5.2-codex)...
   Estimated cost: ~$0.15
   ```

2. **Build 7-section prompt** (see delegation-format.md)

3. **Execute delegation**

4. **Synthesize and present response**:
   ```
   Architect's Analysis:

   [Interpreted and formatted response]

   ---
   Tokens used: 2,341 in / 1,892 out
   Actual cost: $0.03
   ```

## Provider Recommendations by Expert

Present these recommendations but let user override:

| Expert | Recommended | Why |
|--------|-------------|-----|
| Architect | Codex (A) | Deep reasoning for complex decisions |
| Code Reviewer | Codex (A) | Thorough analysis |
| Security Analyst | Codex (A) | Enterprise security patterns |
| Plan Reviewer | Codex (A) | Comprehensive review |
| Scope Analyst | Codex (A) | Detailed requirements analysis |
| Web Designer | Gemini (B) | Multimodal - can analyze images |
| Website Developer | Codex (A) | Complex implementation |
| Documentation Expert | Gemini (B) | 2M context for large codebases |
| Rapid Prototyper | Grok (C) | Speed and cost |
| Bug Fixer | Grok (C) | Fast turnaround, low cost |

## Cost Estimation

Provide estimates based on task complexity:

| Complexity | Input Tokens | Output Tokens | Codex | Gemini | Grok |
|------------|--------------|---------------|-------|--------|------|
| Simple | ~1,000 | ~2,000 | $0.03 | $0.03 | $0.003 |
| Medium | ~5,000 | ~5,000 | $0.08 | $0.07 | $0.008 |
| Complex | ~20,000 | ~10,000 | $0.18 | $0.16 | $0.019 |
| Large | ~50,000 | ~20,000 | $0.37 | $0.34 | $0.040 |

## Handling Invalid Selections

```
Invalid selection. Please use format like "1A" where:
- First character (1-9, 0) = Expert
- Second character (A, B, C) = Provider

Try again:
```
