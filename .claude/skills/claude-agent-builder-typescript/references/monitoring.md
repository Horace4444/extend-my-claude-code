# Production Monitoring & Observability

Strategies for monitoring Claude Agent SDK agents in production.

## Key Metrics

### 1. Performance Metrics

```typescript
interface AgentMetrics {
  // Latency
  totalDuration: number;        // End-to-end time
  firstTokenLatency: number;    // Time to first response
  toolExecutionTime: number;    // Time spent in tools

  // Token usage
  inputTokens: number;
  outputTokens: number;
  totalCost: number;

  // Quality
  successRate: number;          // % of successful completions
  errorRate: number;            // % of errors
  userSatisfaction?: number;    // If available
}
```

### 2. Observability Wrapper

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

class ObservableAgent {
  async run(prompt: string, options: any = {}) {
    const startTime = Date.now();
    const metrics = {
      prompt,
      startTime: new Date(),
      messages: [] as any[],
      tools: [] as string[],
      errors: [] as string[]
    };

    try {
      for await (const message of query({ prompt, options })) {
        metrics.messages.push(message);

        if (message.type === "assistant") {
          message.message.content.forEach((block: any) => {
            if ("name" in block) {
              metrics.tools.push(block.name);
            }
          });
        }

        if (message.type === "result" && message.subtype === "error") {
          metrics.errors.push(message.error?.message || "Unknown error");
        }
      }

      const duration = Date.now() - startTime;
      await this.logMetrics({ ...metrics, duration, success: true });

    } catch (error) {
      metrics.errors.push(error.message);
      await this.logMetrics({
        ...metrics,
        duration: Date.now() - startTime,
        success: false
      });
      throw error;
    }
  }

  private async logMetrics(metrics: any) {
    // Send to monitoring service
    console.log(JSON.stringify(metrics));
  }
}
```

### 3. Structured Logging

```typescript
import pino from "pino";

const logger = pino({
  name: "agent",
  level: "info"
});

class LoggingAgent {
  async execute(taskId: string, prompt: string) {
    logger.info({ taskId, prompt }, "Agent started");

    try {
      const result = await this.runAgent(prompt);
      logger.info({ taskId, result }, "Agent completed");
      return result;
    } catch (error) {
      logger.error({ taskId, error }, "Agent failed");
      throw error;
    }
  }
}
```

### 4. Tracing

```typescript
interface Span {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, any>;
  children: Span[];
}

class TracingAgent {
  private trace: Span;

  constructor() {
    this.trace = {
      id: crypto.randomUUID(),
      name: "agent-execution",
      startTime: Date.now(),
      attributes: {},
      children: []
    };
  }

  startSpan(name: string, attributes: Record<string, any> = {}): Span {
    const span: Span = {
      id: crypto.randomUUID(),
      name,
      startTime: Date.now(),
      attributes,
      children: []
    };
    this.trace.children.push(span);
    return span;
  }

  endSpan(span: Span) {
    span.endTime = Date.now();
  }

  async runWithTracing(prompt: string) {
    const executionSpan = this.startSpan("agent_execution", { prompt });

    for await (const message of query({ prompt, options: {} })) {
      if (message.type === "assistant") {
        message.message.content.forEach((block: any) => {
          if ("name" in block) {
            const toolSpan = this.startSpan("tool_use", {
              toolName: block.name,
              toolInput: block.input
            });
            this.endSpan(toolSpan);
          }
        });
      }
    }

    this.endSpan(executionSpan);
    await this.exportTrace();
  }

  private async exportTrace() {
    // Send to tracing backend (e.g., Jaeger, Datadog)
    console.log(JSON.stringify(this.trace, null, 2));
  }
}
```

## Alerting

```typescript
interface Alert {
  severity: "info" | "warning" | "critical";
  metric: string;
  threshold: number;
  currentValue: number;
  message: string;
}

class AlertManager {
  private thresholds = {
    errorRate: 0.05,      // 5% error rate
    avgLatency: 30000,    // 30s average latency
    costPerTask: 0.50     // $0.50 per task
  };

  async checkMetrics(metrics: AgentMetrics) {
    const alerts: Alert[] = [];

    if (metrics.errorRate > this.thresholds.errorRate) {
      alerts.push({
        severity: "critical",
        metric: "error_rate",
        threshold: this.thresholds.errorRate,
        currentValue: metrics.errorRate,
        message: `Error rate ${(metrics.errorRate * 100).toFixed(2)}% exceeds threshold`
      });
    }

    if (metrics.totalDuration > this.thresholds.avgLatency) {
      alerts.push({
        severity: "warning",
        metric: "latency",
        threshold: this.thresholds.avgLatency,
        currentValue: metrics.totalDuration,
        message: `Latency ${metrics.totalDuration}ms exceeds threshold`
      });
    }

    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }
  }

  private async sendAlerts(alerts: Alert[]) {
    // Send to Slack, PagerDuty, etc.
    for (const alert of alerts) {
      console.error(`[${alert.severity.toUpperCase()}] ${alert.message}`);
    }
  }
}
```

## Dashboards

### Metrics to Track

1. **Throughput** - Tasks per minute/hour
2. **Latency** - P50, P95, P99
3. **Error Rate** - % of failed tasks
4. **Token Usage** - Input/output tokens over time
5. **Cost** - $ per task, total daily cost
6. **Tool Usage** - Which tools are most used
7. **User Satisfaction** - CSAT scores if available

### Example Dashboard Query (Prometheus)

```promql
# Average latency
rate(agent_duration_seconds_sum[5m]) / rate(agent_duration_seconds_count[5m])

# Error rate
rate(agent_errors_total[5m]) / rate(agent_requests_total[5m])

# Cost per task
rate(agent_cost_dollars_sum[1h]) / rate(agent_requests_total[1h])
```

## Best Practices

1. **Log Structured Data** - Use JSON logging
2. **Trace Tool Calls** - Track which tools are used
3. **Monitor Token Usage** - Watch for unexpected spikes
4. **Set Up Alerts** - Critical: errors, latency, cost
5. **Track User Feedback** - CSAT, thumbs up/down
6. **Version Agents** - Track metrics by version
7. **Sample Production Traffic** - Don't log everything
8. **Secure Sensitive Data** - Redact PII from logs
9. **Export to Analytics** - Feed data to BI tools
10. **Review Regularly** - Weekly metric reviews
