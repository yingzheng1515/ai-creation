# Server History Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist generated scripts, images, and videos on the server so different devices can see the same works/assets/history list.

**Architecture:** Add a small REST resource at `/api/history` backed by a JSON file. Move history validation into a shared schema module, keep the client history API as the frontend boundary, and update components to await server reads/writes.

**Tech Stack:** Next.js route handlers, Node `fs/promises`, TypeScript, Vitest.

---

### Task 1: Shared History Validation

**Files:**
- Create: `src/lib/history-schema.ts`
- Modify: `src/lib/history.ts`
- Test: `src/lib/history.test.ts`

- [ ] Write tests that malformed cached entries are ignored.
- [ ] Move `isHistoryEntry` and related guards into `history-schema.ts`.
- [ ] Import those guards from `history.ts`.
- [ ] Run `npm test -- src/lib/history.test.ts`.

### Task 2: Server File Store And API

**Files:**
- Create: `src/lib/history-store.ts`
- Create: `src/app/api/history/route.ts`
- Create: `src/app/api/history/route.test.ts`

- [ ] Write failing route tests for `GET`, `POST`, and `DELETE /api/history`.
- [ ] Implement JSON-file storage with atomic writes and a 50 item cap.
- [ ] Validate POST bodies at the API boundary and return `400` for invalid input.
- [ ] Run `npm test -- src/app/api/history/route.test.ts`.

### Task 3: Frontend History Client

**Files:**
- Modify: `src/lib/history.ts`
- Modify: `src/components/WorkflowShell.tsx`
- Modify: `src/components/HistoryPanel.tsx`
- Modify: `src/components/ScriptTool.tsx`
- Modify: `src/components/ImageTool.tsx`
- Modify: `src/components/VideoTool.tsx`
- Test: existing component tests

- [ ] Convert `getHistory`, `addHistoryEntry`, and `clearHistory` to async calls against `/api/history`.
- [ ] Await saved history writes in generation flows before refreshing.
- [ ] Update tests to mock `/api/history`.
- [ ] Run targeted component tests.

### Task 4: Validation And Deployment Notes

**Files:**
- Modify: `docs/deploy-aliyun.md`

- [ ] Document `HISTORY_FILE_PATH` and `data/history.json`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Commit and push.
