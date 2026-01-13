# Real-World Agent Examples

Production-ready agent implementations for common use cases.

## Example 1: Business Intake Agent

Processes customer intake forms and validates data.

```typescript
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const intakeTools = createSdkMcpServer({
  name: "intake-tools",
  version: "1.0.0",
  tools: [
    tool(
      "validate_email",
      "Validate email address format",
      { email: z.string() },
      async (args) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ valid: isValid })
          }]
        };
      }
    ),

    tool(
      "validate_phone",
      "Validate phone number format",
      { phone: z.string() },
      async (args) => {
        const cleaned = args.phone.replace(/\D/g, "");
        const isValid = cleaned.length === 10 || cleaned.length === 11;
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ valid: isValid, cleaned })
          }]
        };
      }
    ),

    tool(
      "save_intake_data",
      "Save validated intake data to database",
      {
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
        budget: z.number(),
        projectType: z.string()
      },
      async (args) => {
        // Save to database
        const record = await db.intakes.create({ data: args });
        return {
          content: [{
            type: "text",
            text: `Saved intake ID: ${record.id}`
          }]
        };
      }
    )
  ]
});

async function* generateIntakePrompt(formData: any) {
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: `Process this customer intake form:

${JSON.stringify(formData, null, 2)}

Tasks:
1. Validate all contact information (email, phone)
2. Extract and structure the data
3. Save to database using save_intake_data tool
4. Return a summary with validation results`
    }
  };
}

async function runIntakeAgent(formData: any) {
  for await (const message of query({
    prompt: generateIntakePrompt(formData),
    options: {
      mcpServers: { "intake": intakeTools },
      allowedTools: [
        "mcp__intake__validate_email",
        "mcp__intake__validate_phone",
        "mcp__intake__save_intake_data"
      ]
    }
  })) {
    if (message.type === "result" && message.subtype === "success") {
      return message.result;
    }
  }
}
```

## Example 2: Code Review Agent

Reviews code for bugs and style issues.

```typescript
async function runCodeReviewAgent(filePath: string) {
  const systemPrompt = `You are a code review specialist. Analyze code for:

1. Potential bugs (null pointers, race conditions, logic errors)
2. Security vulnerabilities (injection, XSS, authentication issues)
3. Performance problems (N+1 queries, memory leaks)
4. Code style and best practices

For each issue found:
- Severity: critical/high/medium/low
- Location: file:line
- Description: What's wrong
- Suggestion: How to fix`;

  const results: any[] = [];

  for await (const message of query({
    prompt: `Review the file at ${filePath} for potential issues.`,
    options: {
      systemPrompt,
      allowedTools: ["Read"],
      permissionMode: "acceptEdits"
    }
  })) {
    if (message.type === "assistant") {
      message.message.content.forEach((block: any) => {
        if ("text" in block) {
          results.push(block.text);
        }
      });
    }
  }

  return results.join("\n");
}
```

## Example 3: Data Analysis Agent

Analyzes datasets and generates insights.

```typescript
const analysisTools = createSdkMcpServer({
  name: "analysis",
  version: "1.0.0",
  tools: [
    tool(
      "load_csv",
      "Load and parse CSV file",
      { path: z.string() },
      async (args) => {
        const fs = require("fs/promises");
        const Papa = require("papaparse");

        const content = await fs.readFile(args.path, "utf-8");
        const parsed = Papa.parse(content, { header: true });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              rows: parsed.data.length,
              columns: Object.keys(parsed.data[0] || {}),
              sample: parsed.data.slice(0, 5)
            }, null, 2)
          }]
        };
      }
    ),

    tool(
      "calculate_statistics",
      "Calculate basic statistics for a column",
      {
        data: z.array(z.number()),
        columnName: z.string()
      },
      async (args) => {
        const sorted = [...args.data].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        const mean = sum / sorted.length;

        const variance = sorted.reduce((acc, val) => {
          return acc + Math.pow(val - mean, 2);
        }, 0) / sorted.length;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              column: args.columnName,
              count: sorted.length,
              min: sorted[0],
              max: sorted[sorted.length - 1],
              mean,
              median: sorted[Math.floor(sorted.length / 2)],
              stddev: Math.sqrt(variance)
            }, null, 2)
          }]
        };
      }
    )
  ]
});

async function analyzeDataset(csvPath: string) {
  async function* prompt() {
    yield {
      type: "user" as const,
      message: {
        role: "user" as const,
        content: `Analyze the dataset at ${csvPath}:

1. Load the CSV file
2. Identify numeric columns
3. Calculate statistics for each numeric column
4. Identify any anomalies or interesting patterns
5. Provide actionable insights`
      }
    };
  }

  for await (const message of query({
    prompt: prompt(),
    options: {
      mcpServers: { "analysis": analysisTools },
      allowedTools: [
        "mcp__analysis__load_csv",
        "mcp__analysis__calculate_statistics"
      ]
    }
  })) {
    // Process results
  }
}
```

## Example 4: API Integration Agent

Orchestrates multiple API calls.

```typescript
const apiGateway = createSdkMcpServer({
  name: "apis",
  version: "1.0.0",
  tools: [
    tool(
      "stripe_create_customer",
      "Create a Stripe customer",
      {
        email: z.string().email(),
        name: z.string()
      },
      async (args) => {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const customer = await stripe.customers.create({
          email: args.email,
          name: args.name
        });
        return {
          content: [{ type: "text", text: JSON.stringify(customer) }]
        };
      }
    ),

    tool(
      "sendgrid_send_email",
      "Send email via SendGrid",
      {
        to: z.string().email(),
        subject: z.string(),
        body: z.string()
      },
      async (args) => {
        const sgMail = require("@sendgrid/mail");
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        await sgMail.send({
          to: args.to,
          from: "noreply@example.com",
          subject: args.subject,
          text: args.body
        });

        return {
          content: [{ type: "text", text: "Email sent successfully" }]
        };
      }
    ),

    tool(
      "slack_post_message",
      "Post message to Slack",
      {
        channel: z.string(),
        text: z.string()
      },
      async (args) => {
        const { WebClient } = require("@slack/web-api");
        const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

        await slack.chat.postMessage({
          channel: args.channel,
          text: args.text
        });

        return {
          content: [{ type: "text", text: "Posted to Slack" }]
        };
      }
    )
  ]
});

async function onboardNewCustomer(customerData: any) {
  async function* prompt() {
    yield {
      type: "user" as const,
      message: {
        role: "user" as const,
        content: `Onboard new customer: ${JSON.stringify(customerData)}

Steps:
1. Create Stripe customer
2. Send welcome email via SendGrid
3. Post notification to #sales Slack channel

Execute all steps and report status.`
      }
    };
  }

  for await (const message of query({
    prompt: prompt(),
    options: {
      mcpServers: { "apis": apiGateway },
      allowedTools: [
        "mcp__apis__stripe_create_customer",
        "mcp__apis__sendgrid_send_email",
        "mcp__apis__slack_post_message"
      ]
    }
  })) {
    // Handle results
  }
}
```

## Example 5: Aging-in-Place Design Agent

Full example for the aging-in-place workflow.

```typescript
const designTools = createSdkMcpServer({
  name: "design",
  version: "1.0.0",
  tools: [
    tool(
      "analyze_floor_plan",
      "Analyze scanned floor plan for accessibility",
      {
        planData: z.object({
          rooms: z.array(z.any()),
          dimensions: z.record(z.number())
        })
      },
      async (args) => {
        // Analyze doorway widths, hallway clearances, etc.
        const issues: string[] = [];

        args.planData.rooms.forEach(room => {
          if (room.doorWidth < 36) {
            issues.push(`${room.name}: Doorway too narrow (${room.doorWidth}" < 36")`);
          }
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ issues, passable: issues.length === 0 })
          }]
        };
      }
    ),

    tool(
      "check_local_codes",
      "Check local building codes and ADA requirements",
      {
        location: z.string(),
        projectType: z.string()
      },
      async (args) => {
        // Query building codes database
        const codes = await db.buildingCodes.findMany({
          where: {
            jurisdiction: args.location,
            category: "accessibility"
          }
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify(codes, null, 2)
          }]
        };
      }
    ),

    tool(
      "estimate_costs",
      "Generate cost estimate for modifications",
      {
        modifications: z.array(z.object({
          item: z.string(),
          quantity: z.number(),
          unit: z.string()
        }))
      },
      async (args) => {
        // Calculate costs
        const estimates = args.modifications.map(mod => {
          const unitCost = COST_DATABASE[mod.item] || 0;
          return {
            ...mod,
            unitCost,
            total: mod.quantity * unitCost
          };
        });

        const total = estimates.reduce((sum, est) => sum + est.total, 0);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ estimates, total }, null, 2)
          }]
        };
      }
    )
  ]
});

async function processAgingInPlaceProject(submission: any) {
  async function* prompt() {
    yield {
      type: "user" as const,
      message: {
        role: "user" as const,
        content: `Process aging-in-place design project:

Customer: ${submission.customer.name}
Location: ${submission.location}
Budget: $${submission.budget}
Floor Plan: ${JSON.stringify(submission.floorPlan)}
Requirements: ${submission.requirements.join(", ")}

Tasks:
1. Analyze floor plan for accessibility issues
2. Check local building codes for ${submission.location}
3. Generate list of required modifications
4. Estimate costs for each modification
5. Create summary report with recommendations

Generate a comprehensive analysis and cost breakdown.`
      }
    };
  }

  const report: string[] = [];

  for await (const message of query({
    prompt: prompt(),
    options: {
      mcpServers: { "design": designTools },
      allowedTools: [
        "mcp__design__analyze_floor_plan",
        "mcp__design__check_local_codes",
        "mcp__design__estimate_costs"
      ],
      permissionMode: "acceptEdits"
    }
  })) {
    if (message.type === "assistant") {
      message.message.content.forEach((block: any) => {
        if ("text" in block) {
          report.push(block.text);
        }
      });
    }
  }

  return report.join("\n");
}
```

## Example 6: Multi-Agent System

Orchestrating multiple specialized agents.

```typescript
class MultiAgentSystem {
  private agents = {
    intake: this.createIntakeAgent(),
    architect: this.createArchitectAgent(),
    compliance: this.createComplianceAgent(),
    budget: this.createBudgetAgent()
  };

  async processProject(submission: any) {
    // Phase 1: Intake
    const intakeData = await this.agents.intake.run(submission);

    // Phase 2: Parallel analysis
    const [archAnalysis, compliance, budget] = await Promise.all([
      this.agents.architect.run(intakeData.floorPlan),
      this.agents.compliance.run({
        location: intakeData.location,
        scope: intakeData.scope
      }),
      this.agents.budget.run(intakeData.requirements)
    ]);

    // Phase 3: Generate final report
    return {
      intake: intakeData,
      analysis: {
        architectural: archAnalysis,
        compliance,
        budget
      },
      timestamp: new Date()
    };
  }

  private createIntakeAgent() {
    return {
      run: async (data: any) => {
        // Implementation
        return processedData;
      }
    };
  }

  // ... other agent creators
}
```

## Usage Patterns

### Pattern 1: Simple Task Execution

```typescript
const result = await query({
  prompt: "Your task here",
  options: { allowedTools: ["Read", "Edit"] }
});
```

### Pattern 2: With Custom Tools

```typescript
async function* messages() {
  yield { type: "user", message: { role: "user", content: "Task" } };
}

const result = await query({
  prompt: messages(),
  options: {
    mcpServers: { "tools": myServer },
    allowedTools: ["mcp__tools__my_tool"]
  }
});
```

### Pattern 3: With Monitoring

```typescript
const observable = new ObservableAgent();
const result = await observable.run("Task", options);
console.log(`Duration: ${result.metrics.duration}ms`);
console.log(`Cost: $${result.metrics.cost}`);
```

## Best Practices from Examples

1. **Use Zod for validation** - Type-safe schemas
2. **Error handling in tools** - Return `isError` appropriately
3. **Async generators for MCP** - Required when using custom tools
4. **Structured outputs** - JSON for machine-readable results
5. **Clear prompts** - Step-by-step instructions for agent
6. **Permission modes** - `acceptEdits` for automation
7. **Tool composition** - Build complex workflows from simple tools
8. **State management** - Pass context between agents
9. **Monitoring** - Track metrics for production
10. **Testing** - Validate behavior before deployment
