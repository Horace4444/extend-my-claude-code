---
name: status
description: Check the status of configured providers
allowed-tools: Bash, Read
timeout: 30000
---

# Delegator Status

Check the status of all configured AI providers.

## Run Health Checks

```bash
# Check Codex CLI
echo -n "Codex: "
which codex >/dev/null 2>&1 && codex --version 2>/dev/null | head -1 || echo "Not installed"

# Check Gemini API Key
echo -n "Gemini: "
if [ -n "$GEMINI_API_KEY" ]; then
  curl -s "https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}" 2>/dev/null | grep -q "models" && echo "✓ API key valid" || echo "✗ API key invalid"
else
  echo "○ Not configured (GEMINI_API_KEY not set)"
fi

# Check Grok API Key
echo -n "Grok: "
if [ -n "$XAI_API_KEY" ]; then
  curl -s "https://api.x.ai/v1/models" -H "Authorization: Bearer ${XAI_API_KEY}" 2>/dev/null | grep -q "grok" && echo "✓ API key valid" || echo "✗ API key invalid"
else
  echo "○ Not configured (XAI_API_KEY not set)"
fi
```

## Display Status

```
┌─ DELEGATOR STATUS ───────────────────────────────────────────────────┐
│                                                                       │
│  Provider        Model              Status      Pricing               │
│  ─────────────────────────────────────────────────────────────────   │
│  OpenAI Codex    gpt-5.2-codex      [status]    $1.75/$14.00         │
│  Google Gemini   gemini-3-pro       [status]    $2.00/$12.00         │
│  xAI Grok        grok-code-fast-1   [status]    $0.20/$1.50          │
│                                                                       │
│  Available Experts: 10                                                │
│  ─────────────────────────────────────────────────────────────────   │
│  🏗️  Architect       📝 Code Reviewer    🔒 Security Analyst          │
│  📋 Plan Reviewer   🎯 Scope Analyst    🎨 Web Designer              │
│  🌐 Website Dev     📚 Docs Expert      ⚡ Rapid Prototyper          │
│  🐛 Bug Fixer                                                        │
│                                                                       │
│  Quick Commands:                                                      │
│  • /delegate        - Open selection menu                            │
│  • /delegator:setup - Re-run setup wizard                            │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Status Legend

- `✓ Ready` - Provider is configured and working
- `✗ Error` - API key invalid or service unavailable
- `○ Not configured` - Provider not set up yet

## Troubleshooting Tips

If Codex shows "Not installed":
```
npm install -g @openai/codex
codex login
```

If Gemini shows "Not configured":
```
# Get key from: https://aistudio.google.com/apikey
export GEMINI_API_KEY="your-key-here"
# Add to ~/.zshrc for persistence
```

If Grok shows "Not configured":
```
# Get key from: https://console.x.ai/
export XAI_API_KEY="xai-your-key-here"
# Add to ~/.zshrc for persistence
```
