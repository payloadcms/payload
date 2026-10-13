# Recording a Feature Demo

Read this reference when preparing, recording, converting, or revising a local demo.

## Prerequisites

- Repository dependencies are installed, including `@playwright/test`.
- The relevant Payload dev server is running, normally with `pnpm run dev <suite>`.
- Chromium is available to Playwright.
- `ffmpeg` and `ffprobe` are installed for conversion.

Check prerequisites in one command:

```bash
node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs preflight
```

If something is missing, report it and obtain any required installation approval rather than substituting an unrelated capture method. Keep the dev server running through candidate review and revisions instead of restarting it for every take.

## Plan the visible story

Keep the recording narrow. A useful plan identifies:

- the route and deterministic starting state;
- the exact interactions the reviewer needs to see;
- the final visible state that proves the feature works;
- anything dynamic that must be seeded, hidden, or stabilized.

Prefer 10–45 seconds. Avoid long typing sequences, setup screens, loading waits, repeated navigation, and unrelated admin chrome. Use clear fixture labels that make sense without narration.

## Scenario module

Create the scenario outside the repository, for example `/tmp/payload-pr-demo-relationship-drawer.mjs`. It must default-export an async function:

```js
export default async function scenario({ baseURL, click, expect, page, pause }) {
  await page.goto(`${baseURL}/admin/collections/posts`)

  const createButton = page.getByRole('link', { name: 'Create new Post' })
  await expect(createButton).toBeVisible()
  await pause(1200)

  await click(createButton)
  await expect(page.getByRole('heading', { name: 'Create new Post' })).toBeVisible()
  await pause(1200)
}
```

When the scenario needs temporary records, export `setup` and `teardown`. The returned fixture is passed to the default scenario function. Hooks receive a Playwright API request context, so they can prepare data without recording setup screens:

```js
export async function setup({ request }) {
  const response = await request.post('/api/posts', {
    data: { title: 'Demo post' },
  })

  if (!response.ok()) {
    throw new Error(`Could not create demo post: ${response.status()}`)
  }

  return { post: await response.json() }
}

export async function teardown({ fixture, request }) {
  await request.delete(`/api/posts/${fixture.post.doc.id}`)
}

export default async function scenario({ baseURL, click, expect, fixture, page, pause }) {
  await page.goto(`${baseURL}/admin/collections/posts/${fixture.post.doc.id}`)
  // Visible demo interactions only.
}
```

Prefer existing seeded data when it already tells the story. When hooks are needed, authenticate the request context as required by the selected test config and keep hooks idempotent because candidate mode creates and removes one fixture for fast validation, then creates a fresh fixture for the real recording. Teardown runs only after setup succeeds, so setup errors remain visible.

Use semantic locators where practical. Assert each important state before continuing so the recording fails instead of capturing the wrong screen. Let the final proof remain visible for at least a moment.

The recorder supplies:

- `baseURL`: normalized without a trailing slash;
- `click(locator, options?)`: smoothly moves to a locator, pauses, clicks, and pauses again;
- `expect`: Playwright assertions;
- `moveCursor(locator, options?)`: smoothly points at a locator and pauses without clicking;
- `page`: the recorded Playwright page;
- `pause(milliseconds = 700)`: a short presentation pause;
- `scroll(locator, options?)`: scrolls the actual overflow range with frame-timed easing, or real wheel input when requested;
- `label`: the normalized recording label.

The recorder adds a visible cursor to the page. Keep the scenario on one page; popup stitching is outside this skill's current scope.

Use `click` for visible interactions instead of calling `locator.click()` directly. Its defaults are a 400 ms eased cursor movement plus a 300 ms dwell before and after the click. `moveCursor` uses the same travel time and pauses for 300 ms after arriving. Override an individual action when the story needs more time:

```js
await click(saveButton, { after: 900 })
await moveCursor(disabledDestination, { duration: 900, pauseAfter: 1200 })
```

Change the recording-wide defaults with `--mouse-move-ms` and `--interaction-pause-ms`. Keep a nonzero dwell for review recordings; faster values are mainly useful for recorder tests.

## Scroll without hover churn

Destructure `scroll` from the scenario argument and use it for overflow demonstrations:

```js
await scroll(tabsScroller, {
  axis: 'x',
  to: 'end',
  duration: 950,
  easing: 'easeInOutSine',
  cursorPlacement: 'outside',
})
await moveCursor(revealedTab)
await click(revealedTab)
```

Defaults are `axis: 'y'`, `to: 'end'`, `duration: 950`, `easing: 'easeInOutSine'`, `cursorPlacement: 'outside'`, `input: 'animation'`, and `settle: 150` (times are milliseconds). `to` accepts `'start'`, `'end'`, or a numeric pixel distance from the start, clamped to the real range and rounded to whole pixels. Horizontal RTL targets use distance from the right-hand start.

The helper moves the cursor to a temporary invisible anchor just outside the scroller, animates `scrollLeft` or `scrollTop` using `requestAnimationFrame`, checks monotonic progress and the final position within half a CSS pixel, and removes the anchor in `finally`. It fails clearly if the selected axis does not overflow. Animation timing also runs during candidate validation so movement checks are exercised. About 750–1000 ms worked well for a short 64 px range at the recorder's 25 fps; choose timing for the actual story.

Moving the cursor away avoids tooltips changing as tabs move beneath it. Do not hide tooltips with temporary CSS. An oversized wheel delta can exhaust a short range in one frame; splitting deltas improves motion but still causes hover churn when every point in a nested scroller belongs to a tab.

Programmatic scrolling demonstrates overflow, reachability, and presentation. It does not prove wheel or trackpad input handling. When real input semantics are part of the claim, use wheel mode or separate browser assertions:

```js
await scroll(tabsScroller, {
  axis: 'x',
  to: 'end',
  input: 'wheel',
  cursorPlacement: 'inside',
})
```

Wheel mode keeps the pointer over the target for actual hit testing, emits smaller timed wheel deltas, and verifies their resulting positions. Prevented wheel events or scroll snapping that prevents reaching the target fail validation; the helper never repairs wheel results by assigning a scroll position. Hover changes are expected in this mode.

## Fast path

From the repository root:

```bash
node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs candidate \
  --scenario /tmp/payload-pr-demo-relationship-drawer.mjs \
  --label relationship-drawer-take-1
```

Candidate mode automatically:

1. checks Playwright, Chromium, ffmpeg, ffprobe, and the running server;
2. validates the scenario without retaining video or presentation delays;
3. records once with human-readable pacing;
4. converts to H.264 MP4 and fully decodes it to detect corruption;
5. writes a six-frame contact sheet and a JSON manifest containing metadata and SHA-256;
6. removes the intermediate WebM after successful packaging.

It ends at the local review gate and never uploads.

Candidate mode refuses to overwrite an existing MP4, contact sheet, or manifest. Use a new take-specific `--label` for a revision so previously reviewed evidence remains intact.

During scenario development, use the faster modes independently:

```bash
node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs validate \
  --scenario /tmp/payload-pr-demo-relationship-drawer.mjs

node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs preview \
  --scenario /tmp/payload-pr-demo-relationship-drawer.mjs \
  --label relationship-drawer
```

`validate` runs the scenario without video or interaction delays. `preview` writes one final-state PNG, including the cursor position, so cursor and layout changes do not require a full recording.

The converter removes the first 0.75 seconds of browser startup. After asserting the first meaningful state, call `await pause(1200)` before the first interaction so the candidate opens on a readable frame.

Useful options:

- `--base-url http://localhost:4000`
- `--viewport 1280x720`
- `--output /tmp/custom-demo.mp4`
- `--mouse-move-ms 400`
- `--interaction-pause-ms 300`
- `--contact-sheet /tmp/custom-demo-contact-sheet.png`
- `--manifest /tmp/custom-demo.json`

The lower-level `record-demo.mjs` and `convert-demo.sh` remain available for debugging the recorder itself. Use `prepare-demo.mjs` for PR demos so verification and cleanup are not skipped.

## Review the candidate

The command prints the MP4, duration, size, SHA-256, contact sheet, and manifest paths. Inspect the contact sheet first, then watch the entire video. Confirm that the opening frame is meaningful, actions are readable, no sensitive data is visible, and the final state proves the feature. Show the local MP4 to the user and stop for review.

If the file exceeds 10 MB, shorten the scenario first. Adjusting conversion quality with the lower-level converter is secondary. Do not silently raise the size budget because the applicable GitHub limit depends on the repository's plan and the uploader's access.
