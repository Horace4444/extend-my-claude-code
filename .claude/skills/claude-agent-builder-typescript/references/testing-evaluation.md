# Agent Testing & Evaluation

Production-grade testing strategies for Claude Agent SDK agents.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types](#test-types)
3. [Evaluation Metrics](#evaluation-metrics)
4. [Test Infrastructure](#test-infrastructure)
5. [Regression Testing](#regression-testing)
6. [Continuous Evaluation](#continuous-evaluation)

## Testing Philosophy

**Key Principle:** AI agents require different testing strategies than traditional software.

### Traditional vs Agent Testing

| Aspect | Traditional Software | AI Agents |
|--------|---------------------|-----------|
| **Determinism** | Fully deterministic | Non-deterministic responses |
| **Test Assertions** | Exact matches | Semantic similarity, criteria-based |
| **Coverage** | Code paths | Scenario coverage |
| **Failure Modes** | Crashes, errors | Wrong reasoning, hallucinations |
| **Testing Focus** | Logic correctness | Behavior quality |

### Three-Layer Testing Strategy

1. **Unit Tests** - Individual tools and components
2. **Integration Tests** - Agent behavior on tasks
3. **Evaluation Sets** - Real-world scenario coverage

## Test Types

### 1. Tool Unit Tests

Test custom tools independently:

```typescript
import { describe, it, expect } from "vitest";
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

describe("Database Query Tool", () => {
  const queryTool = tool(
    "query_db",
    "Execute database queries",
    {
      query: z.string(),
      params: z.array(z.any()).optional()
    },
    async (args) => {
      // Implementation
      const results = await db.raw(args.query, args.params);
      return {
        content: [{ type: "text", text: JSON.stringify(results) }]
      };
    }
  );

  it("executes valid SELECT queries", async () => {
    const result = await queryTool.handler({
      query: "SELECT * FROM users WHERE id = ?",
      params: ["user-123"]
    });

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain("user-123");
  });

  it("rejects non-SELECT queries", async () => {
    const result = await queryTool.handler({
      query: "DELETE FROM users"
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Only SELECT");
  });

  it("handles database errors gracefully", async () => {
    const result = await queryTool.handler({
      query: "SELECT * FROM nonexistent_table"
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("error");
  });
});
```

### 2. Agent Behavior Tests

Test full agent execution on tasks:

```typescript
import { query, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

async function testAgentTask(
  taskPrompt: string,
  expectedOutcome: (messages: any[]) => boolean
): Promise<boolean> {
  const messages: any[] = [];

  for await (const message of query({
    prompt: taskPrompt,
    options: {
      allowedTools: ["Read", "Edit"],
      permissionMode: "acceptEdits"
    }
  })) {
    messages.push(message);
  }

  return expectedOutcome(messages);
}

describe("Code Review Agent", () => {
  it("identifies bugs in code", async () => {
    const result = await testAgentTask(
      "Review src/buggy.ts and identify any potential null pointer exceptions",
      (messages) => {
        const assistantMessages = messages.filter(m => m.type === "assistant");
        const text = assistantMessages
          .flatMap(m => m.message.content)
          .filter(c => "text" in c)
          .map(c => c.text)
          .join(" ");

        return text.includes("null") && text.includes("undefined");
      }
    );

    expect(result).toBe(true);
  });
});
```

### 3. Evaluation Sets

Systematic testing across scenarios:

```typescript
interface EvaluationCase {
  id: string;
  prompt: string;
  expectedBehavior: string;
  criteria: (messages: any[]) => EvaluationResult;
}

interface EvaluationResult {
  passed: boolean;
  score: number;  // 0-1
  feedback: string;
}

const evaluationSet: EvaluationCase[] = [
  {
    id: "intake-001",
    prompt: "Process this customer intake form: {...}",
    expectedBehavior: "Extract all fields and validate",
    criteria: (messages) => {
      // Check if agent extracted name, email, phone
      // Check if validation was performed
      // Return score based on completeness
      return { passed: true, score: 0.95, feedback: "Good" };
    }
  },
  {
    id: "intake-002",
    prompt: "Process incomplete form: {...}",
    expectedBehavior: "Identify missing required fields",
    criteria: (messages) => {
      // Check if agent identified missing fields
      // Check if appropriate error message was generated
      return { passed: true, score: 1.0, feedback: "Perfect" };
    }
  }
];

async function runEvaluationSet(cases: EvaluationCase[]) {
  const results = [];

  for (const testCase of cases) {
    const messages: any[] = [];

    for await (const message of query({
      prompt: testCase.prompt,
      options: { /* ... */ }
    })) {
      messages.push(message);
    }

    const result = testCase.criteria(messages);
    results.push({
      id: testCase.id,
      ...result
    });
  }

  return results;
}
```

## Evaluation Metrics

### Success Rate

```typescript
interface TestResult {
  testId: string;
  passed: boolean;
  duration: number;
  error?: string;
}

function calculateSuccessRate(results: TestResult[]): number {
  const passed = results.filter(r => r.passed).length;
  return passed / results.length;
}

// Target: > 95% success rate on eval set
```

### Semantic Similarity

Use embeddings to measure output quality:

```typescript
import Anthropic from "@anthropic-ai/sdk";

async function semanticSimilarity(text1: string, text2: string): Promise<number> {
  // Use Claude to evaluate similarity
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `Rate the semantic similarity (0.0 to 1.0) between these texts:

Text 1: ${text1}
Text 2: ${text2}

Respond with only a number between 0.0 and 1.0.`
    }]
  });

  const score = parseFloat(response.content[0].text);
  return score;
}

// Usage in test
it("generates appropriate response", async () => {
  const actual = await runAgent("Explain caching");
  const expected = "Caching stores frequently accessed data in fast memory...";

  const similarity = await semanticSimilarity(actual, expected);
  expect(similarity).toBeGreaterThan(0.8);
});
```

### Criteria-Based Evaluation

```typescript
interface Criteria {
  name: string;
  check: (output: string) => boolean;
  weight: number;
}

const criteriaSet: Criteria[] = [
  {
    name: "Mentions customer name",
    check: (output) => output.includes("John"),
    weight: 1.0
  },
  {
    name: "Professional tone",
    check: (output) => !output.match(/\b(hey|yo|sup)\b/i),
    weight: 0.8
  },
  {
    name: "Includes next steps",
    check: (output) => output.toLowerCase().includes("next step"),
    weight: 0.6
  }
];

function evaluateByCriteria(output: string, criteria: Criteria[]): number {
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const score = criteria
    .filter(c => c.check(output))
    .reduce((sum, c) => sum + c.weight, 0);

  return score / totalWeight;
}
```

### Latency

```typescript
async function measureLatency(prompt: string): Promise<number> {
  const start = Date.now();

  for await (const message of query({ prompt, options: {} })) {
    // Process
  }

  return Date.now() - start;
}

// Target: < 10s for simple tasks, < 60s for complex
```

### Token Usage

```typescript
interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

function extractTokenMetrics(messages: any[]): TokenMetrics {
  // Parse token usage from result messages
  const resultMsg = messages.find(m => m.type === "result");

  return {
    inputTokens: resultMsg?.usage?.input_tokens || 0,
    outputTokens: resultMsg?.usage?.output_tokens || 0,
    totalCost: calculateCost(resultMsg?.usage)
  };
}

function calculateCost(usage: any): number {
  const INPUT_PRICE = 3.00 / 1_000_000;  // $3 per 1M tokens
  const OUTPUT_PRICE = 15.00 / 1_000_000; // $15 per 1M tokens

  return (usage.input_tokens * INPUT_PRICE) +
         (usage.output_tokens * OUTPUT_PRICE);
}
```

## Test Infrastructure

### Test Harness

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { describe, it } from "vitest";

class AgentTestHarness {
  async run(
    prompt: string,
    options: any = {}
  ): Promise<{ messages: any[]; metrics: any }> {
    const messages: any[] = [];
    const start = Date.now();

    for await (const message of query({
      prompt,
      options: {
        ...options,
        permissionMode: "acceptEdits" // Auto-approve for testing
      }
    })) {
      messages.push(message);
    }

    const duration = Date.now() - start;
    const tokens = this.extractTokens(messages);

    return {
      messages,
      metrics: {
        duration,
        tokens,
        cost: this.calculateCost(tokens)
      }
    };
  }

  private extractTokens(messages: any[]) {
    const result = messages.find(m => m.type === "result");
    return result?.usage || { input_tokens: 0, output_tokens: 0 };
  }

  private calculateCost(usage: any): number {
    return (usage.input_tokens * 3 / 1_000_000) +
           (usage.output_tokens * 15 / 1_000_000);
  }
}

// Usage
const harness = new AgentTestHarness();

it("processes intake form", async () => {
  const { messages, metrics } = await harness.run(
    "Extract data from this form: {...}"
  );

  expect(metrics.duration).toBeLessThan(10000); // < 10s
  expect(metrics.cost).toBeLessThan(0.10); // < $0.10
});
```

### Snapshot Testing

```typescript
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

class SnapshotTester {
  private snapshotDir = "./test/snapshots";

  async expectMatchesSnapshot(
    testName: string,
    actualOutput: string
  ): Promise<void> {
    const snapshotPath = join(this.snapshotDir, `${testName}.txt`);

    if (!existsSync(snapshotPath)) {
      // Create new snapshot
      writeFileSync(snapshotPath, actualOutput);
      console.log(`Created snapshot: ${testName}`);
      return;
    }

    const expected = readFileSync(snapshotPath, "utf-8");

    // Compare (allowing minor differences)
    const similarity = await this.compareOutputs(expected, actualOutput);

    if (similarity < 0.9) {
      throw new Error(
        `Snapshot mismatch for ${testName}. Similarity: ${similarity}`
      );
    }
  }

  private async compareOutputs(a: string, b: string): Promise<number> {
    // Use semantic similarity or simple string comparison
    return a === b ? 1.0 : 0.8;
  }
}
```

## Regression Testing

### Golden Dataset

Maintain a set of known-good outputs:

```typescript
interface GoldenExample {
  input: string;
  expectedOutput: string;
  metadata: {
    version: string;
    date: string;
    tester: string;
  };
}

const goldenDataset: GoldenExample[] = [
  {
    input: "Calculate 15% tip on $87.50",
    expectedOutput: "The 15% tip on $87.50 is $13.13...",
    metadata: {
      version: "1.0.0",
      date: "2026-01-12",
      tester: "human"
    }
  }
];

async function runRegressionTests() {
  for (const example of goldenDataset) {
    const actual = await runAgent(example.input);
    const similarity = await semanticSimilarity(actual, example.expectedOutput);

    if (similarity < 0.85) {
      console.error(`REGRESSION: ${example.input}`);
      console.error(`Expected: ${example.expectedOutput}`);
      console.error(`Got: ${actual}`);
    }
  }
}
```

### Version Comparison

```typescript
async function compareVersions(v1Options: any, v2Options: any) {
  const testCases = loadEvaluationSet();
  const v1Results = [];
  const v2Results = [];

  for (const testCase of testCases) {
    // Run with v1 config
    const v1Output = await runAgentWithOptions(testCase.prompt, v1Options);
    v1Results.push(evaluateOutput(v1Output, testCase.criteria));

    // Run with v2 config
    const v2Output = await runAgentWithOptions(testCase.prompt, v2Options);
    v2Results.push(evaluateOutput(v2Output, testCase.criteria));
  }

  // Compare
  const v1Score = average(v1Results.map(r => r.score));
  const v2Score = average(v2Results.map(r => r.score));

  console.log(`V1 average score: ${v1Score}`);
  console.log(`V2 average score: ${v2Score}`);
  console.log(`Improvement: ${((v2Score - v1Score) / v1Score * 100).toFixed(2)}%`);
}
```

## Continuous Evaluation

### CI/CD Integration

```typescript
// test/ci-evaluation.ts

import { runEvaluationSet } from "./evaluation";

async function main() {
  const results = await runEvaluationSet(loadTestCases());

  const successRate = results.filter(r => r.passed).length / results.length;
  const avgScore = average(results.map(r => r.score));

  console.log(`Success Rate: ${(successRate * 100).toFixed(2)}%`);
  console.log(`Average Score: ${avgScore.toFixed(3)}`);

  // Fail CI if below threshold
  if (successRate < 0.95) {
    console.error("❌ Success rate below 95% threshold");
    process.exit(1);
  }

  if (avgScore < 0.85) {
    console.error("❌ Average score below 0.85 threshold");
    process.exit(1);
  }

  console.log("✅ All evaluation metrics passed");
}

main();
```

### Monitoring Production

```typescript
class ProductionEvaluator {
  private results: EvaluationResult[] = [];

  async evaluateProduction(agentOutput: string, userFeedback?: string) {
    // Log for offline evaluation
    this.results.push({
      timestamp: new Date(),
      output: agentOutput,
      userFeedback,
      metrics: await this.calculateMetrics(agentOutput)
    });

    // Alert on degradation
    const recentScore = this.getRecentAverageScore();
    if (recentScore < 0.8) {
      await this.sendAlert("Agent quality degradation detected");
    }
  }

  private getRecentAverageScore(): number {
    const recent = this.results.slice(-100); // Last 100 runs
    return average(recent.map(r => r.metrics.score));
  }
}
```

## Best Practices

1. **Test at Multiple Levels** - Unit, integration, evaluation
2. **Maintain Golden Dataset** - Known-good examples for regression
3. **Use Semantic Similarity** - Not exact string matching
4. **Track Metrics Over Time** - Success rate, latency, cost
5. **Automate in CI/CD** - Run eval set on every change
6. **Version Test Cases** - Track changes to expectations
7. **Monitor Production** - Continuous evaluation on live traffic
8. **User Feedback Loop** - Incorporate real user feedback into tests
9. **Test Edge Cases** - Invalid inputs, errors, boundary conditions
10. **Document Failures** - Learn from test failures to improve agent

## Testing Checklist

Before deploying an agent:

- [ ] All custom tools have unit tests
- [ ] Happy path scenarios pass
- [ ] Error handling works correctly
- [ ] Edge cases covered
- [ ] Evaluation set success rate > 95%
- [ ] Average quality score > 0.85
- [ ] Latency within acceptable range
- [ ] Cost per task within budget
- [ ] Regression tests pass
- [ ] CI/CD pipeline configured
- [ ] Production monitoring enabled
