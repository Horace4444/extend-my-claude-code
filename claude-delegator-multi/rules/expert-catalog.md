# Expert Catalog

Quick reference for all available experts in claude-delegator-multi.

## Core Experts

Available on all providers (Codex, Gemini, Grok).

### 🏗️ Architect
**ID**: `architect`
**Specialty**: System design, tradeoffs, technical strategy
**Best Provider**: Codex (complex reasoning)

**When to Use**:
- Designing new systems or features
- Evaluating technical tradeoffs
- Planning migrations or refactors
- Debugging complex cross-system issues

**Example Requests**:
- "Design a caching strategy for our API"
- "What are the tradeoffs between microservices and monolith?"
- "How should we structure the database for multi-tenancy?"

---

### 📝 Code Reviewer
**ID**: `code-reviewer`
**Specialty**: Code quality, bugs, maintainability
**Best Provider**: Codex (thorough analysis)

**When to Use**:
- Reviewing PRs or code changes
- Finding bugs in existing code
- Improving code quality
- Ensuring best practices

**Example Requests**:
- "Review this authentication implementation"
- "Find bugs in this data processing code"
- "How can I make this function more maintainable?"

---

### 🔒 Security Analyst
**ID**: `security-analyst`
**Specialty**: Vulnerabilities, threat modeling, hardening
**Best Provider**: Codex (enterprise security patterns)

**When to Use**:
- Security audits
- Reviewing auth implementations
- Threat modeling
- Compliance checks

**Example Requests**:
- "Is this authentication flow secure?"
- "Find vulnerabilities in this API"
- "How should we handle sensitive data?"

---

### 📋 Plan Reviewer
**ID**: `plan-reviewer`
**Specialty**: Validate plans before execution
**Best Provider**: Codex (comprehensive review)

**When to Use**:
- Before starting significant work
- Validating implementation approaches
- Catching potential issues early
- Reviewing project plans

**Example Requests**:
- "Review my plan for implementing user roles"
- "What am I missing in this migration plan?"
- "Is this approach going to scale?"

---

### 🎯 Scope Analyst
**ID**: `scope-analyst`
**Specialty**: Requirements clarification, boundary definition
**Best Provider**: Codex (detailed analysis)

**When to Use**:
- Unclear requirements
- Defining project scope
- Preventing scope creep
- Creating acceptance criteria

**Example Requests**:
- "What questions should I ask about these requirements?"
- "Help me define the scope for this feature"
- "What's included vs excluded in this project?"

---

## Specialized Experts

Optimized for specific providers based on their strengths.

### 🎨 Web Designer
**ID**: `web-designer`
**Specialty**: UI/UX design, visual design, design systems
**Best Provider**: Gemini (multimodal - can analyze images)

**When to Use**:
- Designing UI components
- Reviewing website designs
- Creating design systems
- Analyzing competitor sites

**Example Requests**:
- "Review this homepage design and suggest improvements"
- "Create a pricing page component like Stripe's"
- "Analyze this screenshot and identify UX issues"

**Special Features**:
- Can process images (screenshots, mockups)
- Can analyze URLs for design patterns

---

### 🌐 Website Developer
**ID**: `website-developer`
**Specialty**: Full-stack web development, React, Next.js
**Best Provider**: Codex (complex implementation)

**When to Use**:
- Building web features
- React/Next.js development
- API development
- Database design

**Example Requests**:
- "Build a user dashboard with these features"
- "Implement authentication with NextAuth"
- "Create an API for managing projects"

---

### 📚 Documentation Expert
**ID**: `documentation-expert`
**Specialty**: Technical documentation, API docs, READMEs
**Best Provider**: Gemini (2M context for large codebases)

**When to Use**:
- Writing documentation
- Creating API references
- Documenting existing code
- Writing guides and tutorials

**Example Requests**:
- "Document this API endpoint"
- "Create a README for this project"
- "Write a getting started guide"

---

### ⚡ Rapid Prototyper
**ID**: `rapid-prototyper`
**Specialty**: Fast iterations, quick POCs, scaffolding
**Best Provider**: Grok (speed and cost)

**When to Use**:
- Building quick proofs of concept
- Scaffolding new features
- Testing ideas rapidly
- When speed matters more than perfection

**Example Requests**:
- "Quickly prototype a chat interface"
- "Scaffold a new API endpoint"
- "Create a basic version to test the concept"

---

### 🐛 Bug Fixer
**ID**: `bug-fixer`
**Specialty**: Rapid diagnosis, surgical fixes
**Best Provider**: Grok (fast turnaround, low cost)

**When to Use**:
- Fixing specific bugs
- Debugging errors
- Quick targeted fixes
- When you know roughly what's wrong

**Example Requests**:
- "Fix this null pointer exception"
- "Why is this test failing?"
- "Debug this API timeout issue"

---

## Provider Quick Reference

| Provider | Model | Context | Input$/1M | Output$/1M | Best For |
|----------|-------|---------|-----------|------------|----------|
| **Codex** | gpt-5.2-codex | 400K | $1.75 | $14.00 | Complex reasoning |
| **Gemini** | gemini-3-pro | 2M | $2.00 | $12.00 | Large context, images |
| **Grok** | grok-code-fast-1 | 256K | $0.20 | $1.50 | Speed, low cost |

## Selection Quick Reference

```
Expert Selection:
1 = Architect       6 = Web Designer
2 = Code Reviewer   7 = Website Developer
3 = Security        8 = Documentation
4 = Plan Reviewer   9 = Rapid Prototyper
5 = Scope Analyst   0 = Bug Fixer

Provider Selection:
A = Codex (OpenAI)
B = Gemini (Google)
C = Grok (xAI)

Examples:
"1A" = Architect on Codex
"6B" = Web Designer on Gemini
"0C" = Bug Fixer on Grok
```
