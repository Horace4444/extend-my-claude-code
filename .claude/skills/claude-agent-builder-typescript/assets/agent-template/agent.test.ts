import { describe, it, expect } from "vitest";
import { Agent, customTools, CONFIG } from "./agent";

describe("Agent", () => {
  it("should initialize with correct configuration", () => {
    const agent = new Agent();
    expect(CONFIG.agentName).toBe("MyAgent");
    expect(CONFIG.version).toBe("1.0.0");
  });

  it("should have custom tools configured", () => {
    expect(customTools).toBeDefined();
  });

  // Add more tests for your specific agent behavior
});
