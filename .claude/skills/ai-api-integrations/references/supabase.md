# Supabase API Reference

## Overview

Supabase is a Postgres development platform with Authentication, instant APIs, Edge Functions, Realtime subscriptions, Storage, and Vector embeddings.

**Core Features**:
- PostgreSQL database with RESTful APIs (auto-generated)
- Authentication (multiple providers + MFA)
- Row Level Security (RLS)
- Realtime subscriptions
- Storage (S3-compatible)
- Edge Functions (Deno runtime)
- pgvector for AI/ML embeddings

## Client Initialization

### JavaScript/TypeScript

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_ANON_KEY! // or SUPABASE_SERVICE_ROLE_KEY for admin access
);
```

### With TypeScript Types

```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface Database {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; created_at: string };
        Insert: { id?: string; email: string; created_at?: string };
        Update: { id?: string; email?: string; created_at?: string };
      };
    };
  };
}

const supabase: SupabaseClient<Database> = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_ANON_KEY!
);
```

## Common Patterns

### 1. Database Queries

#### Select

```typescript
// Select all
const { data, error } = await supabase
  .from("users")
  .select("*");

// Select specific columns
const { data, error } = await supabase
  .from("users")
  .select("id, email, profile:profiles(*)")
  .eq("status", "active")
  .order("created_at", { ascending: false })
  .limit(10);

// Count
const { count, error } = await supabase
  .from("users")
  .select("*", { count: "exact", head: true });
```

#### Insert

```typescript
const { data, error } = await supabase
  .from("users")
  .insert([
    { email: "user1@example.com", name: "User 1" },
    { email: "user2@example.com", name: "User 2" },
  ])
  .select(); // Returns inserted rows
```

#### Update

```typescript
const { data, error } = await supabase
  .from("users")
  .update({ status: "inactive" })
  .eq("id", userId)
  .select();
```

#### Delete

```typescript
const { data, error } = await supabase
  .from("users")
  .delete()
  .eq("id", userId);
```

#### Upsert

```typescript
const { data, error } = await supabase
  .from("users")
  .upsert({ id: userId, email: "new@example.com" }, { onConflict: "id" });
```

### 2. Authentication

#### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "securePassword123",
  options: {
    data: {
      full_name: "John Doe",
      age: 30,
    },
  },
});
```

#### Sign In

```typescript
// Email/Password
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "securePassword123",
});

// Magic Link
const { data, error } = await supabase.auth.signInWithOtp({
  email: "user@example.com",
});

// OAuth (Google, GitHub, etc.)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: "https://yourapp.com/auth/callback",
  },
});
```

#### Get Current User

```typescript
const { data: { user }, error } = await supabase.auth.getUser();
```

#### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

#### Multi-Factor Authentication (MFA)

```typescript
// Enroll TOTP
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: "totp",
});

// Verify TOTP
const { data, error } = await supabase.auth.mfa.verify({
  factorId: data.id,
  code: "123456",
});

// SMS/WhatsApp MFA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: "phone",
  phone: "+1234567890",
});
```

### 3. Row Level Security (RLS)

#### Enable RLS on Table

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

#### Create Policy

```sql
-- Users can only read their own data
CREATE POLICY "Users can view own data"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
USING (auth.uid() = id);

-- Public read access
CREATE POLICY "Public profiles are viewable"
ON profiles
FOR SELECT
USING (true);
```

### 4. Storage

#### Upload File

```typescript
const file = event.target.files[0];

const { data, error } = await supabase.storage
  .from("avatars")
  .upload(`public/${userId}/avatar.png`, file, {
    cacheControl: "3600",
    upsert: true,
  });
```

#### Download File

```typescript
const { data, error } = await supabase.storage
  .from("avatars")
  .download(`public/${userId}/avatar.png`);
```

#### Get Public URL

```typescript
const { data } = supabase.storage
  .from("avatars")
  .getPublicUrl(`public/${userId}/avatar.png`);

console.log(data.publicUrl);
```

#### List Files

```typescript
const { data, error } = await supabase.storage
  .from("avatars")
  .list("public", {
    limit: 100,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" },
  });
```

#### Delete File

```typescript
const { data, error } = await supabase.storage
  .from("avatars")
  .remove([`public/${userId}/avatar.png`]);
```

### 5. Realtime Subscriptions

#### Subscribe to Table Changes

```typescript
const channel = supabase
  .channel("public:messages")
  .on(
    "postgres_changes",
    {
      event: "*", // INSERT, UPDATE, DELETE, or *
      schema: "public",
      table: "messages",
      filter: "room_id=eq.1", // Optional filter
    },
    (payload) => {
      console.log("Change received!", payload);
    }
  )
  .subscribe();

// Unsubscribe
channel.unsubscribe();
```

#### Presence (Track Online Users)

```typescript
const channel = supabase.channel("room-1");

// Track user presence
await channel.subscribe(async (status) => {
  if (status === "SUBSCRIBED") {
    await channel.track({ user_id: userId, online_at: new Date().toISOString() });
  }
});

// Listen to presence changes
channel.on("presence", { event: "sync" }, () => {
  const state = channel.presenceState();
  console.log("Online users:", state);
});
```

### 6. Vector Search (pgvector)

#### Create Vector Column

```sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE documents
ADD COLUMN embedding vector(1536); -- OpenAI embedding size

CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);
```

#### Store Embeddings

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate embedding
const response = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: "Your text here",
});

const embedding = response.data[0].embedding;

// Store in Supabase
const { data, error } = await supabase
  .from("documents")
  .insert({
    content: "Your text here",
    embedding: embedding,
  });
```

#### Semantic Search with RPC Function

```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

#### Query from TypeScript

```typescript
// Generate query embedding
const queryEmbedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: "Search query",
});

// Search
const { data, error } = await supabase.rpc("match_documents", {
  query_embedding: queryEmbedding.data[0].embedding,
  match_threshold: 0.5,
  match_count: 10,
});
```

### 7. Edge Functions

#### Create Edge Function

```typescript
// supabase/functions/hello/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { name } = await req.json();

  return new Response(
    JSON.stringify({ message: `Hello ${name}!` }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

#### Invoke Edge Function

```typescript
const { data, error } = await supabase.functions.invoke("hello", {
  body: { name: "World" },
});

console.log(data); // { message: "Hello World!" }
```

#### Authenticated Edge Function

```typescript
// Edge Function
serve(async (req) => {
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");

  const { data: { user }, error } = await supabaseClient.auth.getUser(token);

  if (error) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  return new Response(JSON.stringify({ user }));
});

// Client
const { data, error } = await supabase.functions.invoke("protected", {
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});
```

## Error Handling

```typescript
const { data, error } = await supabase.from("users").select("*");

if (error) {
  if (error.code === "PGRST116") {
    console.error("No rows found");
  } else if (error.code === "42501") {
    console.error("Permission denied (RLS policy)");
  } else {
    console.error("Database error:", error.message);
  }
}
```

## Best Practices

### Security
- **Always enable RLS** on public tables
- Use `anon` key for client-side, `service_role` key for server-side admin operations
- Never expose `service_role` key to clients
- Write specific RLS policies (avoid `USING (true)` for write operations)

### Performance
- Create indexes on frequently queried columns
- Use `select()` to fetch only needed columns
- Limit result sets with `.limit()` and `.range()`
- Use connection pooling for serverless environments

### API Keys (New System - 2025)
```bash
# New publishable key (replaces anon key)
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Secret keys (multiple allowed)
SUPABASE_SECRET_KEY=sb_secret_...

# Legacy keys (deprecated)
SUPABASE_ANON_KEY=...  # Still supported but migrate to publishable
SUPABASE_SERVICE_ROLE_KEY=...  # Still supported
```

### Realtime
- Unsubscribe from channels when no longer needed
- Filter subscriptions to reduce bandwidth
- Use presence for ephemeral state only

### Storage
- Organize files with clear folder structures
- Set appropriate RLS policies on storage buckets
- Use signed URLs for temporary access
- Implement file size limits

## Environment Variables

```bash
# Required
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...  # or SUPABASE_PUBLISHABLE_KEY

# Optional (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Admin access
SUPABASE_SECRET_KEY=sb_secret_...  # New secret key system

# Database connection (optional, for direct Postgres access)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

## TypeScript Type Generation

```bash
# Generate types from database schema
npx supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

```typescript
import { Database } from "./types/supabase";

const supabase = createClient<Database>(url, key);

// Now fully typed!
const { data } = await supabase.from("users").select("*");
// data is typed as Database['public']['Tables']['users']['Row'][]
```
