# File Backed Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal real account system so users can sign in with an account name and access code, then keep their generated works under a stable account workspace.

**Architecture:** Store account records in a server JSON file under `HISTORY_DATA_DIR/auth/accounts.json`. Hash access codes with Node `crypto.scrypt`, issue signed HttpOnly session cookies for authenticated accounts, and reuse the existing history storage by switching the session user id from visitor id to account id.

**Tech Stack:** Next.js App Router route handlers, Node `crypto`, file-backed JSON store, React, Vitest.

---

### Task 1: Auth API Contract

**Files:**
- Create: `src/app/api/auth/login/route.test.ts`
- Create: `src/app/api/auth/logout/route.test.ts`
- Modify: `src/app/api/session/route.test.ts`

- [x] Test login creates an account when the normalized account name does not exist.
- [x] Test login reuses the same account id with the correct access code.
- [x] Test login rejects an incorrect access code with `401`.
- [x] Test logout returns the browser to a visitor session.
- [x] Test `GET /api/session` returns authenticated account metadata for a signed account cookie.

### Task 2: Server Auth Store And Signed Sessions

**Files:**
- Create: `src/lib/auth-store.ts`
- Modify: `src/lib/session.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Modify: `src/app/api/session/route.ts`

- [x] Normalize and validate account names and access codes at the route boundary.
- [x] Hash access codes using `scrypt` with a per-account salt.
- [x] Sign authenticated cookies with HMAC SHA-256.
- [x] Keep legacy visitor cookies working for anonymous users.

### Task 3: Frontend Login Surface

**Files:**
- Modify: `src/lib/session-client.ts`
- Modify: `src/components/WorkflowShell.tsx`
- Modify: `src/components/WorkflowShell.test.tsx`

- [x] Add login form controls in the left sidebar.
- [x] Submit account name and access code to `/api/auth/login`.
- [x] Add logout action.
- [x] Refresh user label and history after login/logout.

### Task 4: Deployment Docs And Validation

**Files:**
- Modify: `docs/deploy-aliyun.md`

- [x] Document `SESSION_SECRET`.
- [x] Document account storage path and deployment exclusion.
- [x] Run focused tests, full tests, production build, and local route smoke tests.
