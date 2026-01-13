# Clerk Authentication API Reference

## Overview

Clerk provides authentication and user management with support for:
- Email/password authentication
- Social OAuth (Google, GitHub, Facebook, etc.)
- Magic links and OTP
- Multi-factor authentication (SMS, TOTP, Backup codes)
- Session management
- Organizations and multi-tenancy
- Machine-to-machine authentication (API keys)

**Updated**: December 2025 - Includes latest API keys feature

## Client Initialization

### Backend (Node.js/TypeScript)

```typescript
import { Clerk } from "@clerk/backend";

const clerk = new Clerk({
  apiKey: process.env.CLERK_SECRET_KEY,
});
```

### Frontend (React/Next.js)

```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
}
```

## Common Patterns

### 1. User Management

#### Get User

```typescript
const user = await clerk.users.getUser(userId);

console.log(user.emailAddresses[0].emailAddress);
console.log(user.firstName, user.lastName);
```

#### List Users

```typescript
const users = await clerk.users.getUserList({
  limit: 10,
  offset: 0,
  orderBy: "-created_at", // Descending order
});

for (const user of users.data) {
  console.log(user.id, user.emailAddresses[0].emailAddress);
}
```

#### Create User

```typescript
const user = await clerk.users.createUser({
  emailAddress: ["user@example.com"],
  password: "securePassword123",
  firstName: "John",
  lastName: "Doe",
  publicMetadata: {
    role: "member",
  },
});
```

#### Update User

```typescript
const user = await clerk.users.updateUser(userId, {
  firstName: "Jane",
  publicMetadata: {
    role: "admin",
  },
});
```

#### Delete User

```typescript
await clerk.users.deleteUser(userId);
```

### 2. Authentication

#### Verify Session Token (Backend)

```typescript
import { verifyToken } from "@clerk/backend";

async function authenticateRequest(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    return payload; // Contains userId, sessionId, etc.
  } catch (error) {
    throw new Error("Invalid token");
  }
}
```

#### Get Current User (Frontend)

```typescript
import { useUser } from "@clerk/nextjs";

function MyComponent() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>;

  if (!isSignedIn) return <div>Please sign in</div>;

  return <div>Hello, {user.firstName}!</div>;
}
```

#### Sign Out (Frontend)

```typescript
import { useClerk } from "@clerk/nextjs";

function SignOutButton() {
  const { signOut } = useClerk();

  return <button onClick={() => signOut()}>Sign out</button>;
}
```

### 3. Session Management

#### Get Session

```typescript
const session = await clerk.sessions.getSession(sessionId);

console.log(session.userId);
console.log(session.status); // "active", "expired", "revoked"
```

#### List Sessions for User

```typescript
const sessions = await clerk.sessions.getSessionList({
  userId: userId,
});

for (const session of sessions.data) {
  console.log(session.id, session.status, session.lastActiveAt);
}
```

#### Revoke Session

```typescript
await clerk.sessions.revokeSession(sessionId);
```

### 4. Organizations (Multi-Tenancy)

#### Create Organization

```typescript
const organization = await clerk.organizations.createOrganization({
  name: "Acme Corp",
  slug: "acme-corp",
  createdBy: userId,
});
```

#### Add Member

```typescript
await clerk.organizations.createOrganizationMembership({
  organizationId: orgId,
  userId: userId,
  role: "org:member", // or "org:admin"
});
```

#### Get Organization Members

```typescript
const members = await clerk.organizations.getOrganizationMembershipList({
  organizationId: orgId,
});

for (const member of members.data) {
  console.log(member.publicUserData.identifier, member.role);
}
```

#### Check Organization Membership (Frontend)

```typescript
import { useOrganization } from "@clerk/nextjs";

function OrgComponent() {
  const { organization, membership } = useOrganization();

  if (!organization) return <div>No organization</div>;

  return (
    <div>
      <h1>{organization.name}</h1>
      <p>Your role: {membership?.role}</p>
    </div>
  );
}
```

### 5. API Keys (Machine-to-Machine Auth)

**New Feature - December 2025**

#### Create API Key

```typescript
const apiKey = await clerk.apiKeys.createApiKey({
  name: "Production API Key",
  scopes: ["users:read", "sessions:read"],
});

console.log("API Key:", apiKey.key); // Save this securely
```

#### List API Keys

```typescript
const apiKeys = await clerk.apiKeys.getApiKeyList();

for (const key of apiKeys.data) {
  console.log(key.name, key.createdAt, key.lastUsedAt);
}
```

#### Revoke API Key

```typescript
await clerk.apiKeys.revokeApiKey(apiKeyId);
```

#### Authenticate with API Key

```typescript
// Client request
fetch("https://api.yourapp.com/data", {
  headers: {
    "Authorization": `Bearer ${apiKey}`,
  },
});

// Server verification
const payload = await verifyToken(apiKey, {
  secretKey: process.env.CLERK_SECRET_KEY,
});
```

### 6. Webhooks

#### Setup Webhook Endpoint

```typescript
import { Webhook } from "svix";

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
  }

  // Get headers
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing headers", { status: 400 });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook
  const wh = new Webhook(webhookSecret);

  let evt;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    return new Response("Error: Invalid signature", { status: 400 });
  }

  // Handle event
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name } = evt.data;
    console.log("New user:", id, email_addresses[0].email_address);
  }

  return new Response("OK", { status: 200 });
}
```

#### Webhook Event Types

- `user.created`
- `user.updated`
- `user.deleted`
- `session.created`
- `session.ended`
- `organization.created`
- `organization.updated`
- `organizationMembership.created`
- `organizationMembership.deleted`

### 7. Metadata

#### Public Metadata (visible to frontend)

```typescript
await clerk.users.updateUser(userId, {
  publicMetadata: {
    role: "admin",
    department: "Engineering",
  },
});

// Frontend access
const { user } = useUser();
console.log(user?.publicMetadata?.role); // "admin"
```

#### Private Metadata (backend only)

```typescript
await clerk.users.updateUser(userId, {
  privateMetadata: {
    stripeCustomerId: "cus_123",
    internalNotes: "VIP customer",
  },
});

// Only accessible from backend
const user = await clerk.users.getUser(userId);
console.log(user.privateMetadata?.stripeCustomerId);
```

#### Unsafe Metadata (user-provided, untrusted)

```typescript
// Frontend update
await user.update({
  unsafeMetadata: {
    theme: "dark",
    preferences: { notifications: true },
  },
});
```

### 8. Middleware (Next.js)

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect(); // Require authentication
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### 9. Custom Claims (JWT)

```typescript
// Add custom claims to session token
await clerk.users.updateUser(userId, {
  publicMetadata: {
    role: "admin",
  },
});

// Access in JWT
const { sessionClaims } = auth();
console.log(sessionClaims?.metadata?.role); // "admin"
```

## Error Handling

```typescript
import { ClerkAPIError } from "@clerk/backend";

try {
  const user = await clerk.users.getUser(userId);
} catch (error) {
  if (error instanceof ClerkAPIError) {
    console.error("Clerk API error:", error.status, error.message);
    console.error("Error code:", error.clerkError?.code);
  } else {
    console.error("Unknown error:", error);
  }
}
```

## Best Practices

### Security
- Never expose `CLERK_SECRET_KEY` to frontend
- Use `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` for frontend
- Validate webhook signatures
- Implement proper CORS policies
- Use private metadata for sensitive data

### Performance
- Cache user data when appropriate
- Use middleware for route protection (faster than per-route checks)
- Implement session caching on backend

### User Experience
- Use Clerk's prebuilt components (`<SignIn />`, `<UserButton />`)
- Implement proper loading states
- Handle auth redirects gracefully
- Provide clear error messages

### Organizations
- Use organizations for B2B SaaS multi-tenancy
- Implement role-based access control (RBAC)
- Cache organization membership checks
- Use organization metadata for tenant-specific settings

### API Keys
- Rotate API keys regularly
- Use scoped permissions (least privilege)
- Monitor API key usage
- Revoke unused keys

## Environment Variables

```bash
# Required
CLERK_SECRET_KEY=sk_test_...  # Backend API key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # Frontend publishable key

# Optional
CLERK_WEBHOOK_SECRET=whsec_...  # For webhook verification
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in  # Custom sign-in URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up  # Custom sign-up URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard  # Post-login redirect
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding  # Post-signup redirect
```

## TypeScript Types

```typescript
import { User, Session, Organization } from "@clerk/backend";

async function handleUser(userId: string): Promise<User> {
  const user = await clerk.users.getUser(userId);
  return user;
}

interface CustomMetadata {
  role: "admin" | "member" | "guest";
  department: string;
}

// Type-safe metadata access
const user = await clerk.users.getUser(userId);
const metadata = user.publicMetadata as CustomMetadata;
console.log(metadata.role);
```

## Authorization Helpers

```typescript
import { auth } from "@clerk/nextjs/server";

// Protect API route
export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Continue with authorized logic
}

// Require specific role
export async function DELETE() {
  const { sessionClaims } = auth();

  if (sessionClaims?.metadata?.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  // Admin-only logic
}

// Organization-specific route
export async function POST() {
  const { orgId, userId } = auth();

  if (!orgId) {
    return new Response("No organization", { status: 400 });
  }

  // Organization-scoped logic
}
```
