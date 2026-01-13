# Model Orchestration

You have access to multiple AI expert systems via MCP tools. Use them through **manual selection** - always let the user choose which expert and provider to use.

## Available Tools

| Tool | Provider | Model | Best For |
|------|----------|-------|----------|
| `mcp__codex__codex` | OpenAI | gpt-5.2-codex | Complex reasoning, multi-file, enterprise |
| `mcp__gemini__gemini` | Google | gemini-3-pro | Large context (2M), multimodal, documentation |
| `mcp__grok__grok` | xAI | grok-code-fast-1 | Speed, cost-effectiveness, fast iteration |

## Core Principle: Manual Selection

**Never auto-select providers or experts.** Always present the user with options and let them choose.

See `manual-selection.md` for the selection interface specification.

## Available Experts

| Expert | Icon | Specialty | Recommended Provider |
|--------|------|-----------|---------------------|
| **Architect** | 🏗️ | System design, tradeoffs | Codex |
| **Code Reviewer** | 📝 | Code quality, bugs | Codex |
| **Security Analyst** | 🔒 | Vulnerabilities, hardening | Codex |
| **Plan Reviewer** | 📋 | Plan validation | Codex |
| **Scope Analyst** | 🎯 | Requirements clarification | Codex |
| **Web Designer** | 🎨 | UI/UX, visual design | Gemini |
| **Website Developer** | 🌐 | Full-stack web dev | Codex |
| **Documentation Expert** | 📚 | Technical docs | Gemini |
| **Rapid Prototyper** | ⚡ | Fast iterations | Grok |
| **Bug Fixer** | 🐛 | Surgical fixes | Grok |

## Stateless Design

**Each delegation is independent.** The expert has no memory of previous calls.

**Implications:**
- Include ALL relevant context in every delegation prompt
- For retries, include what was attempted and what failed
- Don't assume the expert remembers previous interactions

## Delegation Flow

When user selects an expert + provider:

### Step 1: Confirm Selection
Acknowledge the user's choice:
```
Delegating to [Expert Name] on [Provider] ([model])...
```

### Step 2: Read Expert Prompt
Load the expert's system prompt from `prompts/[expert].md`.

### Step 3: Build 7-Section Prompt
Use the format from `delegation-format.md`:
1. TASK
2. EXPECTED OUTCOME
3. CONTEXT
4. CONSTRAINTS
5. MUST DO
6. MUST NOT DO
7. OUTPUT FORMAT

### Step 4: Call the Expert
```typescript
mcp__[provider]__[tool]({
  prompt: "[your 7-section delegation prompt]",
  "developer-instructions": "[contents of expert prompt file]",
  sandbox: "[read-only or workspace-write]",
  cwd: "[current working directory]"
})
```

### Step 5: Synthesize Response
1. **Never show raw output** - Interpret and present clearly
2. **Extract key insights** - Summarize recommendations
3. **Apply judgment** - Experts can be wrong; evaluate critically
4. **Verify if implementation** - Confirm changes work

## Retry Flow

When implementation fails, retry with a NEW call including error context:

```
Attempt 1 → Verify → [Fail]
     ↓
Attempt 2 (include: original task + what was tried + error) → Verify
     ↓
Attempt 3 (include: full history) → Verify → [Fail]
     ↓
Escalate to user
```

## Cost Awareness

Always provide cost estimates when presenting selection:
- **Codex**: ~$0.02-0.50 per task (complex reasoning)
- **Gemini**: ~$0.01-0.30 per task (balanced)
- **Grok**: ~$0.005-0.10 per task (cost-effective)

## Anti-Patterns

| Don't Do This | Do This Instead |
|---------------|-----------------|
| Auto-select provider | Present selection menu |
| Delegate trivial questions | Answer directly |
| Show raw expert output | Synthesize and interpret |
| Skip cost estimates | Always show estimated cost |
| Retry without context | Include full error history |
