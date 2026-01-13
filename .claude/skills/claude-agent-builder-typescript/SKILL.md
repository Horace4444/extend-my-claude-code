---
name: claude-agent-builder-typescript
description: Comprehensive guide for building production-ready Claude Agent SDK agents in TypeScript. Use when working with the @anthropic-ai/claude-agent-sdk npm package to create, test, deploy, or optimize AI agents for business workflows, automation, data processing, API integration, or multi-agent orchestration. Covers custom tool development with SDK MCP servers, testing & evaluation frameworks, production monitoring & observability, multi-agent coordination patterns, and enterprise-grade agent architectures. Essential for building agents that need custom tools, production deployment, systematic testing, performance monitoring, or coordination between multiple specialized agents.
---

# Claude Agent Builder - TypeScript

Build production-ready Claude Agent SDK agents with TypeScript for business automation, workflow orchestration, and AI-powered operations.

## Quick Start

### Installation

```bash
npm install @anthropic-ai/claude-agent-sdk zod
npm install --save-dev typescript @types/node
```

### Basic Agent

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Your task description",
  options: {
    allowedTools: ["Read", "Edit"],
    permissionMode: "acceptEdits"
  }
})) {
  if (message.type === "result") {
    console.log("Done:", message.result);
  }
}
```

### With Custom Tools

```typescript
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const server = createSdkMcpServer({
  name: "my-tools",
  version: "1.0.0",
  tools: [
    tool(
      "process_data",
      "Process business data",
      { input: z.string() },
      async (args) => ({
        content: [{ type: "text", text: `Processed: ${args.input}` }]
      })
    )
  ]
});

async function* messages() {
  yield {
    type: "user" as const,
    message: { role: "user" as const, content: "Use the tool" }
  };
}

for await (const msg of query({
  prompt: messages(),
  options: {
    mcpServers: { "tools": server },
    allowedTools: ["mcp__tools__process_data"]
  }
})) {
  // Handle messages
}
```

## Core Documentation

### 1. SDK API Reference

Complete TypeScript SDK API documentation.

**Read:** [sdk-api.md](references/sdk-api.md)

**Key topics:**
- Installation & setup
- `query()` and V2 API functions
- `tool()` and `createSdkMcpServer()`
- Configuration options
- Message types
- Error handling
- Advanced features (context management, cloud providers)

### 2. Custom Tool Development

Advanced patterns for creating production-ready custom tools.

**Read:** [custom-tools.md](references/custom-tools.md)

**Key topics:**
- Tool design principles (single responsibility, clear contracts)
- Common patterns (data retrieval, API gateway, file processing, state management)
- Error handling (recoverable vs fatal errors)
- Type safety with Zod
- Performance optimization (caching, batching)
- Security best practices
- Tool testing strategies

### 3. Testing & Evaluation

Production-grade testing and evaluation strategies.

**Read:** [testing-evaluation.md](references/testing-evaluation.md)

**Key topics:**
- Three-layer testing strategy (unit, integration, evaluation sets)
- Evaluation metrics (success rate, semantic similarity, latency, token usage)
- Test infrastructure (harnesses, snapshot testing)
- Regression testing with golden datasets
- Continuous evaluation in CI/CD
- Production monitoring

### 4. Production Monitoring

Observability and monitoring for deployed agents.

**Read:** [monitoring.md](references/monitoring.md)

**Key topics:**
- Key metrics (performance, token usage, quality)
- Observability wrappers
- Structured logging
- Distributed tracing
- Alerting thresholds
- Dashboard metrics

### 5. Multi-Agent Orchestration

Patterns for coordinating multiple specialized agents.

**Read:** [orchestration.md](references/orchestration.md)

**Key topics:**
- Orchestration strategies (sequential, manager-worker, parallel, hierarchical, reflective)
- State management across agents
- Real-world patterns
- Dynamic orchestration

### 6. Real-World Examples

Production-ready agent implementations.

**Read:** [examples.md](references/examples.md)

**Examples included:**
- Business intake agent
- Code review agent
- Data analysis agent
- API integration agent
- Aging-in-place design agent
- Multi-agent system

## Agent Template

Production-ready starter template with monitoring, error handling, and testing.

**Location:** `assets/agent-template/`

**Files:**
- `agent.ts` - Main agent implementation
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `agent.test.ts` - Test file template

**Usage:**

```bash
# Copy template to your project
cp -r assets/agent-template/ /path/to/your/agent

# Install dependencies
cd /path/to/your/agent
npm install

# Customize configuration in agent.ts
# Implement your custom tools
# Add your business logic

# Run
npm start

# Test
npm test
```

## Development Workflow

### 1. Define Agent Purpose

Clearly articulate what the agent does:
- Domain/specialty
- Responsibilities
- Expected inputs/outputs
- Success criteria

### 2. Design Custom Tools

Identify what tools the agent needs:
- What external systems to integrate?
- What data processing is required?
- What validations are needed?

Use patterns from [custom-tools.md](references/custom-tools.md).

### 3. Implement Agent

Start with the template in `assets/agent-template/`:
- Configure system prompt
- Implement custom tools
- Add error handling
- Set up monitoring

### 4. Test Thoroughly

Follow testing strategy from [testing-evaluation.md](references/testing-evaluation.md):
- Unit test custom tools
- Integration test agent behavior
- Create evaluation set
- Run regression tests

### 5. Deploy & Monitor

Set up production monitoring from [monitoring.md](references/monitoring.md):
- Structured logging
- Metrics tracking
- Alerting
- Dashboard

### 6. Iterate

Continuously improve based on:
- Production metrics
- User feedback
- Edge cases discovered
- Performance bottlenecks

## Best Practices

### Tool Development
- **Single responsibility** - One tool, one job
- **Type everything** - Use Zod for runtime + compile-time validation
- **Handle errors gracefully** - Distinguish recoverable from fatal
- **Test independently** - Validate tools before agent integration

### Agent Architecture
- **Clear system prompt** - Define role, responsibilities, guidelines
- **Appropriate permissions** - Use `bypassPermissions` only in production
- **Token management** - Use 1M context model for long-running tasks
- **State management** - Pass context between multi-turn conversations

### Testing
- **Multiple levels** - Unit, integration, evaluation sets
- **Golden dataset** - Known-good examples for regression
- **Semantic similarity** - Not exact string matching
- **Automate in CI/CD** - Run eval set on every change

### Production
- **Structured logging** - JSON format with context
- **Track metrics** - Latency, success rate, cost, token usage
- **Set up alerts** - Error rate, latency, cost thresholds
- **Monitor continuously** - Real-time observability

### Multi-Agent Systems
- **Clear responsibilities** - Each agent has specific role
- **Fail gracefully** - Handle agent failures
- **Parallel when possible** - Speed up with concurrency
- **Version agents** - Track which version produced results

## Common Patterns

### Pattern 1: Business Workflow Agent

Orchestrates business processes (intake, validation, routing).

**Example:** Customer intake agent that validates form data, checks for completeness, and routes to appropriate team.

**See:** [examples.md](references/examples.md) - Example 1

### Pattern 2: Domain Specialist Agent

Deep expertise in specific domain (design, finance, legal, technical).

**Example:** Interior design agent that analyzes floor plans, suggests modifications, and estimates costs.

**See:** [examples.md](references/examples.md) - Example 5

### Pattern 3: Integration Agent

Connects to and orchestrates external services and APIs.

**Example:** Onboarding agent that creates Stripe customer, sends welcome email, and posts to Slack.

**See:** [examples.md](references/examples.md) - Example 4

### Pattern 4: Analysis Agent

Processes data and generates insights.

**Example:** Data analysis agent that loads CSVs, calculates statistics, and identifies patterns.

**See:** [examples.md](references/examples.md) - Example 3

### Pattern 5: Multi-Agent Orchestrator

Coordinates multiple specialized agents for complex workflows.

**Example:** Project orchestrator that runs intake, architecture, compliance, and budget agents in sequence.

**See:** [orchestration.md](references/orchestration.md) and [examples.md](references/examples.md) - Example 6

## Troubleshooting

### Issue: Custom tools not being called

**Solution:** Ensure you're using async generator for prompt when using MCP:

```typescript
async function* messages() {
  yield { type: "user", message: { role: "user", content: "Task" } };
}

query({ prompt: messages(), options: { mcpServers: { ... } } });
```

### Issue: High token costs

**Solutions:**
- Use more specific system prompts
- Limit context with targeted tool outputs
- Cache expensive operations
- Use 1M context model for long conversations

### Issue: Slow agent execution

**Solutions:**
- Profile tool execution times
- Optimize slow tools (caching, batching)
- Run independent operations in parallel
- Consider simpler prompts

### Issue: Agent produces inconsistent results

**Solutions:**
- More specific system prompt
- Better tool descriptions
- Add validation tools
- Use evaluation sets to measure consistency

### Issue: Tools return errors

**Solutions:**
- Add comprehensive error handling in tools
- Validate inputs before processing
- Return `isError: false` for recoverable errors
- Log errors for debugging

## Resources

- **TypeScript SDK Docs:** https://platform.claude.com/docs/en/agent-sdk/typescript
- **GitHub:** https://github.com/anthropics/claude-agent-sdk-typescript
- **Custom Tools Guide:** https://platform.claude.com/docs/en/agent-sdk/custom-tools
- **MCP Documentation:** https://platform.claude.com/docs/en/agent-sdk/mcp

## Version

Skill Version: 1.0.0
SDK Compatibility: @anthropic-ai/claude-agent-sdk latest
Last Updated: 2026-01-12

## Support

For agent development assistance:
1. Review relevant reference documentation above
2. Check examples for similar use cases
3. Use the agent template as starting point
4. Test thoroughly before production deployment
