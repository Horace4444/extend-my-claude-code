# Delegation Format

Every delegation to an expert must use the standardized 7-section prompt format.

## The 7-Section Format

```markdown
## TASK
[Clear, specific description of what needs to be done]

## EXPECTED OUTCOME
[What success looks like - deliverables, criteria]

## CONTEXT
[All relevant background information]
- Current state of the code/system
- Relevant files and their purposes
- Previous attempts and results (if retry)
- User's constraints or preferences

## CONSTRAINTS
[Boundaries and limitations]
- Technology constraints
- Time/budget constraints
- Compatibility requirements
- Non-functional requirements

## MUST DO
[Required elements - non-negotiable]
- [ ] Specific requirement 1
- [ ] Specific requirement 2
- [ ] Specific requirement 3

## MUST NOT DO
[Prohibited actions - things to avoid]
- Do not modify unrelated files
- Do not introduce breaking changes
- Do not skip error handling
- Do not use deprecated APIs

## OUTPUT FORMAT
[How the response should be structured]
Provide your response in this format:
1. Summary
2. [Specific sections needed]
3. Code (if applicable)
4. Next steps
```

## Section Guidelines

### TASK
- One clear sentence stating the objective
- Action-oriented ("Design...", "Review...", "Fix...")
- Specific enough to be unambiguous

**Good**: "Design a caching strategy for user session data that reduces database load by 50%"
**Bad**: "Make caching better"

### EXPECTED OUTCOME
- Measurable when possible
- Lists specific deliverables
- Defines what "done" looks like

**Good**: "A design document with: 1) Cache architecture diagram, 2) Technology recommendation, 3) Implementation steps, 4) Estimated performance improvement"
**Bad**: "A good caching solution"

### CONTEXT
- Include ALL relevant information
- Paste relevant code snippets
- Mention frameworks, versions, constraints
- For retries: include previous attempt + error

**Include**:
- Relevant file contents
- Error messages (if debugging)
- System architecture overview
- Dependencies and versions

### CONSTRAINTS
- Technical limitations
- Business requirements
- Compatibility needs
- Performance targets

**Examples**:
- Must work with Node.js 18+
- Cannot add new dependencies
- Must maintain backward compatibility
- Response time < 100ms

### MUST DO
- Checkboxes for required items
- Non-negotiable requirements
- Safety requirements
- Quality gates

### MUST NOT DO
- Common mistakes to avoid
- Files/code that shouldn't change
- Patterns to avoid
- Side effects to prevent

### OUTPUT FORMAT
- Specify structure clearly
- Request specific sections
- Define code formatting needs
- Ask for next steps if appropriate

## Example: Architecture Task

```markdown
## TASK
Design the authentication architecture for a multi-tenant SaaS application.

## EXPECTED OUTCOME
A complete architecture proposal including:
- Authentication flow diagram
- Technology stack recommendation (with rationale)
- Database schema for auth-related tables
- API endpoint specifications
- Security considerations

## CONTEXT
- Building a B2B SaaS platform for project management
- Expected 10,000+ organizations, 100,000+ users
- Using Next.js 15, PostgreSQL, deployed on Vercel
- Need SSO support (SAML, OIDC) for enterprise customers
- Mobile apps will authenticate via the same system

Current relevant files:
- `lib/db/schema.ts` - Database schema (Drizzle)
- `app/api/auth/` - Current basic auth implementation

## CONSTRAINTS
- Must support email/password AND social login AND SSO
- Session tokens must be stateless (JWT or similar) for edge deployment
- Must comply with SOC 2 requirements
- Cannot use server-side sessions (Vercel edge functions)

## MUST DO
- [ ] Support multi-tenancy (user belongs to organizations)
- [ ] Include rate limiting strategy
- [ ] Address token refresh flow
- [ ] Plan for audit logging
- [ ] Consider password reset flow

## MUST NOT DO
- Do not store passwords in plain text
- Do not use deprecated crypto functions
- Do not expose internal IDs in tokens
- Do not skip input validation

## OUTPUT FORMAT
1. Executive Summary (2-3 sentences)
2. Architecture Diagram (ASCII or description)
3. Technology Recommendations (with pros/cons)
4. Database Schema
5. API Specifications
6. Security Considerations
7. Implementation Phases
```

## Example: Bug Fix Task

```markdown
## TASK
Fix the "Cannot read property 'map' of undefined" error when loading the dashboard.

## EXPECTED OUTCOME
- The dashboard loads without errors
- Empty state is handled gracefully
- Root cause is identified and documented

## CONTEXT
Error occurs in `app/dashboard/page.tsx` at line 42.

Stack trace:
```
TypeError: Cannot read property 'map' of undefined
    at Dashboard (app/dashboard/page.tsx:42:23)
    at renderWithHooks (...)
```

The code:
```tsx
// app/dashboard/page.tsx
export default async function Dashboard() {
  const projects = await getProjects(); // Line 40

  return (
    <div>
      {projects.map(p => <ProjectCard key={p.id} project={p} />)} // Line 42
    </div>
  );
}
```

`getProjects()` implementation:
```tsx
// lib/api/projects.ts
export async function getProjects() {
  const response = await fetch('/api/projects');
  if (!response.ok) return; // Returns undefined on error!
  return response.json();
}
```

## CONSTRAINTS
- Fix must not break other uses of `getProjects()`
- Must handle both empty array and error states
- Keep the fix minimal

## MUST DO
- [ ] Handle undefined return from getProjects
- [ ] Add appropriate error handling
- [ ] Show user-friendly message when no projects

## MUST NOT DO
- Do not change the API response format
- Do not add unnecessary complexity
- Do not modify unrelated files

## OUTPUT FORMAT
1. Root Cause Analysis
2. The Fix (with diff)
3. Why This Fixes It
4. Testing Steps
```

## Tips for Effective Delegation

1. **Be Specific**: Vague tasks get vague responses
2. **Provide Code**: Paste relevant snippets, don't just describe
3. **Include Errors**: Full error messages, not summaries
4. **Set Boundaries**: Clear MUST NOT prevents unwanted changes
5. **Request Format**: Get responses in the structure you need
