# Multi-Agent Orchestration Patterns

Patterns for coordinating multiple specialized agents.

## Orchestration Strategies

### 1. Sequential Pipeline

Agents execute in order, each consuming previous output.

```typescript
class SequentialOrchestrator {
  async execute(input: string, agents: Agent[]) {
    let current = input;

    for (const agent of agents) {
      current = await agent.run(current);
    }

    return current;
  }
}

// Usage: Intake → Analysis → Output Generation
const pipeline = new SequentialOrchestrator();
const result = await pipeline.execute(userInput, [
  intakeAgent,
  analysisAgent,
  outputAgent
]);
```

### 2. Manager-Worker Pattern

A manager agent delegates to specialized workers.

```typescript
class ManagerAgent {
  private workers = {
    architect: new ArchitectAgent(),
    policy: new PolicyAgent(),
    analyst: new AnalystAgent()
  };

  async delegate(task: string) {
    // Manager decides which worker to use
    const classification = await this.classifyTask(task);

    switch (classification) {
      case "architecture":
        return await this.workers.architect.run(task);
      case "compliance":
        return await this.workers.policy.run(task);
      case "analysis":
        return await this.workers.analyst.run(task);
      default:
        throw new Error(`Unknown task type: ${classification}`);
    }
  }

  private async classifyTask(task: string): Promise<string> {
    // Use Claude to classify
    // Or use rules-based logic
  }
}
```

### 3. Parallel Execution

Multiple agents work simultaneously, results combined.

```typescript
class ParallelOrchestrator {
  async execute(input: string, agents: Agent[]) {
    const promises = agents.map(agent => agent.run(input));
    const results = await Promise.all(promises);

    return this.combineResults(results);
  }

  private combineResults(results: string[]): string {
    return results.join("\n\n---\n\n");
  }
}

// Usage: Get multiple perspectives simultaneously
const orchestrator = new ParallelOrchestrator();
const analysis = await orchestrator.execute(floorPlan, [
  architecturalAgent,    // Structural feasibility
  complianceAgent,       // Building codes
  budgetAgent           // Cost estimation
]);
```

### 4. Hierarchical Orchestration

Tiered structure with sub-managers.

```typescript
class HierarchicalOrchestrator {
  private topManager = new ManagerAgent();
  private subManagers = {
    research: new ResearchManager(),
    design: new DesignManager(),
    compliance: new ComplianceManager()
  };

  async execute(project: Project) {
    // Top-level coordination
    const plan = await this.topManager.planExecution(project);

    // Delegate to sub-managers
    const results = await Promise.all([
      this.subManagers.research.execute(plan.research Tasks),
      this.subManagers.design.execute(plan.designTasks),
      this.subManagers.compliance.execute(plan.complianceTasks)
    ]);

    // Final integration
    return await this.topManager.integrate(results);
  }
}
```

### 5. Reflective Pattern

Agent reviews its own output and iterates.

```typescript
class ReflectiveAgent {
  async executeWithReflection(task: string, maxIterations = 3) {
    let output = await this.run(task);

    for (let i = 0; i < maxIterations; i++) {
      const critique = await this.critique(output);

      if (critique.satisfactory) {
        break;
      }

      // Improve based on critique
      output = await this.run(`
Previous attempt: ${output}

Issues identified: ${critique.issues.join(", ")}

Please provide an improved version addressing these issues.
      `);
    }

    return output;
  }

  private async critique(output: string) {
    // Use a separate agent or Claude call to evaluate
    const evaluation = await claudeEvaluate(output);
    return evaluation;
  }
}
```

## Real-World Pattern: Aging-in-Place Design

```typescript
class AgingInPlaceOrchestrator {
  private agents = {
    intake: new IntakeAgent(),
    architect: new ArchitectAgent(),
    policy: new PolicyAgent(),
    analyst: new AnalystAgent(),
    research: new ResearchAgent(),
    marketing: new MarketingAgent()
  };

  async processProject(userSubmission: any) {
    // Phase 1: Intake & Validation
    const intakeData = await this.agents.intake.process(userSubmission);

    // Phase 2: Parallel Analysis
    const [architectural, compliance, costs] = await Promise.all([
      this.agents.architect.analyze(intakeData.floorPlan),
      this.agents.policy.check(intakeData.location, intakeData.scope),
      this.agents.analyst.estimate(intakeData.scope)
    ]);

    // Phase 3: Research if needed
    let research = null;
    if (compliance.needsResearch) {
      research = await this.agents.research.investigate({
        location: intakeData.location,
        topics: compliance.researchTopics
      });
    }

    // Phase 4: Generate final deliverables
    const proposal = await this.agents.marketing.createProposal({
      intake: intakeData,
      architecture: architectural,
      compliance: { ...compliance, research },
      costs
    });

    return proposal;
  }
}
```

## State Management

### Shared Context

```typescript
interface SharedContext {
  projectId: string;
  customer: any;
  floorPlan: any;
  requirements: any;
  findings: Record<string, any>;
}

class ContextAwareOrchestrator {
  private context: SharedContext;

  async execute(initialData: any) {
    this.context = this.initializeContext(initialData);

    // Each agent reads from and writes to context
    await this.agents.intake.run(this.context);
    await this.agents.architect.run(this.context);
    await this.agents.analyst.run(this.context);

    return this.context;
  }
}
```

## Best Practices

1. **Clear Responsibilities** - Each agent has a specific role
2. **Fail Gracefully** - Handle agent failures without crashing
3. **Parallel When Possible** - Speed up with concurrent execution
4. **State Management** - Track shared context clearly
5. **Monitoring** - Log all agent interactions
6. **Timeouts** - Set max execution time per agent
7. **Retry Logic** - Handle transient failures
8. **Version Agents** - Track which agent version produced results
9. **Cost Tracking** - Monitor spend across all agents
10. **Human in Loop** - Allow manual overrides

## Advanced: Dynamic Orchestration

```typescript
class DynamicOrchestrator {
  async execute(task: string) {
    // Use Claude to plan orchestration
    const plan = await this.planExecution(task);

    // Execute plan
    const results = new Map<string, any>();

    for (const step of plan.steps) {
      const agent = this.getAgent(step.agentType);
      const input = this.prepareInput(step, results);
      const output = await agent.run(input);
      results.set(step.id, output);
    }

    return this.combineResults(plan, results);
  }

  private async planExecution(task: string) {
    // Ask Claude to create execution plan
    const response = await query({
      prompt: `Create an execution plan for: ${task}

Available agents: intake, architect, policy, analyst, research, marketing

Output JSON with:
{
  "steps": [
    { "id": "step1", "agentType": "intake", "dependsOn": [] },
    { "id": "step2", "agentType": "architect", "dependsOn": ["step1"] }
  ]
}`,
      options: {}
    });

    // Parse plan from Claude's response
    return JSON.parse(extractJSON(response));
  }
}
```

## Orchestration Checklist

- [ ] Define clear agent responsibilities
- [ ] Implement shared context/state
- [ ] Add error handling and retries
- [ ] Set execution timeouts
- [ ] Log all agent interactions
- [ ] Track costs per agent
- [ ] Monitor success rates
- [ ] Test failure scenarios
- [ ] Document orchestration flow
- [ ] Version control agent configs
