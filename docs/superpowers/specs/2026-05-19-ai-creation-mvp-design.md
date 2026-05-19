# AI Creation Website MVP Design

Date: 2026-05-19
Mode: design specification
Status: approved for planning

## Goal

Build a Next.js MVP website where a user can enter a requirement and use three independent AI tools:

- Script generation
- Image generation
- Video generation

The first implementation will not call real third-party APIs. It will define replaceable provider interfaces and use mock providers so the site can be built, tested, and later connected to real services without changing the UI contract.

## Decisions Confirmed

- Product scope: MVP, not a full SaaS platform.
- Framework: Next.js full-stack app.
- API strategy: replaceable provider layer with mock implementations first.
- User flow: three independent tools, not an automatic pipeline.
- Persistence: browser local storage for generation history.
- Layout: tabbed workspace.

## Non-Goals

The MVP will not include:

- User accounts or login.
- Payment, credits, or quotas.
- Server-side database persistence.
- Background queues.
- Real API credentials.
- Production deployment configuration.
- Object storage for generated media.

These can be added after the core tool experience is validated.

## User Experience

The home page is a compact workspace, not a marketing landing page.

The main navigation uses tabs:

- Write Script
- Generate Image
- Generate Video
- History

Each tool tab has:

- A focused input form.
- A generate button.
- Loading and error states.
- A result preview.
- Actions to copy text or save the result to local history where applicable.

The History tab reads from `localStorage`, shows recent generations grouped by type, and supports clearing saved history.

## Frontend Components

The first version should keep component boundaries simple:

- `ToolTabs`: controls the selected tool view.
- `ScriptTool`: form and result view for script generation.
- `ImageTool`: form and result view for image generation.
- `VideoTool`: form and result view for video generation.
- `HistoryPanel`: local history list and clear action.
- `ResultCard`: shared result display shell.

The UI should be practical and compact. It should avoid large instructional sections, marketing copy, and unnecessary dashboards.

## API Routes

The app exposes three POST routes:

- `POST /api/generate/script`
- `POST /api/generate/image`
- `POST /api/generate/video`

Each route should:

- Parse JSON input.
- Validate the required prompt or requirement field.
- Call the matching provider.
- Return a consistent JSON response.
- Return clear error responses for invalid input and provider failures.

## API Contracts

Script request:

```json
{
  "requirement": "短视频主题、目标用户、风格或其他需求"
}
```

Script response:

```json
{
  "type": "script",
  "content": "生成的脚本文字",
  "provider": "mock",
  "createdAt": "ISO-8601 timestamp"
}
```

Image request:

```json
{
  "prompt": "图片提示词"
}
```

Image response:

```json
{
  "type": "image",
  "url": "可预览图片地址",
  "prompt": "图片提示词",
  "provider": "mock",
  "createdAt": "ISO-8601 timestamp"
}
```

Video request:

```json
{
  "prompt": "视频提示词或视频描述"
}
```

Video response:

```json
{
  "type": "video",
  "url": "可预览视频地址",
  "prompt": "视频提示词或视频描述",
  "provider": "mock",
  "createdAt": "ISO-8601 timestamp"
}
```

## Provider Layer

Provider interfaces isolate third-party API details from routes and UI.

Planned provider modules:

- `scriptProvider.generateScript(input)`
- `imageProvider.generateImage(input)`
- `videoProvider.generateVideo(input)`

Mock providers should return deterministic, useful sample data:

- Script provider returns a structured Chinese short-video script.
- Image provider returns a stable placeholder image URL.
- Video provider returns a stable placeholder video URL.

When real APIs are added later, provider implementations can read credentials from `.env.local` and keep the same route contracts.

## Local History

The browser stores successful generations in `localStorage`.

Storage key:

```text
ai-creation-history:v1
```

History entries should include:

- `id`
- `type`
- `input`
- `result`
- `provider`
- `createdAt`

Local history is a convenience feature only. It is not a durable or cross-device source of truth.

## Error Handling

The UI should show:

- Required-field validation before sending a request.
- Loading state while a request is pending.
- A readable error message if the API returns an error.
- A disabled generate button while a request is already in flight.

The API should return:

- `400` for missing or invalid input.
- `500` for provider failures.
- JSON error bodies with a short `error` string.

## Testing And Validation

Implementation validation should include:

- TypeScript check or Next.js build.
- Lint if configured.
- Manual smoke test in the browser.

Smoke test coverage:

- Switching all tabs works.
- Script generation returns text.
- Image generation shows a preview.
- Video generation shows a preview or clear mock result.
- Successful results are saved to local history.
- History clearing works.
- Empty inputs show validation errors.

## Risks

- Real video generation APIs often require asynchronous jobs. The MVP keeps synchronous mock routes for speed. When real video API integration starts, a task-status model may be needed.
- Placeholder image and video URLs should be stable enough for local smoke testing.
- Local history can be cleared by the browser and is not suitable for account-level product behavior.

## Next Step

After this specification is reviewed, create an implementation plan for the Next.js MVP scaffold, provider interfaces, API routes, tabbed UI, local history, and validation workflow.
