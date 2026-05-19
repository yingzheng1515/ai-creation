# Session Scoped History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate generated works by visitor session so different devices or users do not share one global history file.

**Architecture:** Add an HttpOnly session cookie issued by API routes. Store history under a per-session file path beneath the server data directory. Expose a small session endpoint so the UI can show which visitor workspace is active.

**Tech Stack:** Next.js App Router route handlers, Node file storage, Vitest, React Testing Library.

---

### Task 1: Session Contract And Route Tests

**Files:**
- Create: `src/lib/session.ts`
- Create: `src/app/api/session/route.ts`
- Test: `src/app/api/session/route.test.ts`
- Modify: `src/app/api/history/route.test.ts`

- [x] Write tests that a first request receives `Set-Cookie: ai_creation_session=...`.
- [x] Write tests that an existing session cookie is reused.
- [x] Write tests that two different session cookies do not see each other's history entries.

### Task 2: Per-Session History Store

**Files:**
- Modify: `src/lib/history-store.ts`
- Modify: `src/app/api/history/route.ts`
- Test: `src/app/api/history/route.test.ts`

- [x] Add a `userId` argument to list, add, and clear history store functions.
- [x] Resolve file paths to `data/users/<userId>/history.json`.
- [x] Sanitize user ids before using them in a filesystem path.

### Task 3: Frontend Session Display

**Files:**
- Create: `src/lib/session-client.ts`
- Modify: `src/components/WorkflowShell.tsx`
- Test: `src/components/WorkflowShell.test.tsx`

- [x] Load the current session label on mount.
- [x] Replace the static user chip text with the server session label.
- [x] Keep history loading unchanged from the component caller's point of view.

### Task 4: Docs And Validation

**Files:**
- Modify: `docs/deploy-aliyun.md`

- [x] Document that generated records are now saved under `data/users/`.
- [x] Run focused API/component tests.
- [x] Run full `npm test`, `npm run build`, and a local API smoke test.
