---
name: uninstall
description: Remove claude-delegator-multi configuration
allowed-tools: Bash, AskUserQuestion
timeout: 60000
---

# Uninstall claude-delegator-multi

Remove the delegator plugin configuration while preserving API credentials.

## Confirmation

Ask user to confirm:

```
⚠️  UNINSTALL CLAUDE-DELEGATOR-MULTI

This will:
✓ Remove MCP server configurations from Claude settings
✓ Remove installed rules

This will NOT:
○ Remove your API keys (GEMINI_API_KEY, XAI_API_KEY)
○ Uninstall Codex CLI
○ Delete the plugin directory

Are you sure you want to uninstall? (yes/no)
```

## Uninstall Steps

If confirmed:

### Step 1: Remove MCP Configurations

Edit `~/.claude/settings.json` to remove:
- `mcpServers.codex`
- `mcpServers.gemini`
- `mcpServers.grok`

### Step 2: Remove Rules

```bash
rm -rf ~/.claude/rules/delegator-multi/
```

### Step 3: Confirm Removal

```
╔═══════════════════════════════════════════════════════════════════════╗
║  ✓ UNINSTALL COMPLETE                                                 ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  Removed:                                                             ║
║  • MCP server configurations                                          ║
║  • Delegation rules                                                   ║
║                                                                       ║
║  Preserved:                                                           ║
║  • API keys in environment                                            ║
║  • Codex CLI installation                                             ║
║  • Plugin source directory                                            ║
║                                                                       ║
║  To reinstall later:                                                  ║
║  /delegator:setup                                                     ║
║                                                                       ║
║  To fully remove API credentials:                                     ║
║  • Remove GEMINI_API_KEY from ~/.zshrc                               ║
║  • Remove XAI_API_KEY from ~/.zshrc                                  ║
║  • Run: codex logout                                                  ║
║                                                                       ║
║  ⚠️  Restart Claude Code to complete uninstall.                       ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## Optional: Full Removal

If user wants complete removal, provide these commands:

```bash
# Remove Codex CLI
npm uninstall -g @openai/codex

# Remove API keys from shell config
# Edit ~/.zshrc or ~/.bashrc and remove:
# export GEMINI_API_KEY="..."
# export XAI_API_KEY="..."

# Remove plugin directory (if desired)
rm -rf /path/to/claude-delegator-multi
```
