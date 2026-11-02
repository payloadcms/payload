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

## Required window chrome

For presentation metadata, viewport resizing, and annotation APIs, read [window-chrome.md](window-chrome.md). Use the live browser preview to iterate on the shared component without recording a video. Every scenario must export `presentation` with a change kind, title, and description. Validation, preview, and recording always use the shared chrome; there is no page-only mode.

## Plan the visible story

Keep the recording narrow. A useful plan identifies:

- the route and deterministic starting state;
- the exact interactions the reviewer needs to see;
- the final visible state that proves the feature works;
- anything dynamic that must be seeded, hidden, or stabilized.

Prefer 10–45 seconds. Avoid long typing sequences, setup screens, loading waits, repeated navigation, and unrelated admin chrome. Use clear fixture labels that make sense without narration.

## Editorial annotations over the recording

Annotations live in the shared chrome panel above the application. The change title and description stay constant; step titles and bodies update through `showAnnotation` and `hideAnnotation`. Supply content and optional one-based `index`/`total`, which default to 1. If the scenario uses annotations, show the initial note before `ready()` and keep it visible at that marker. Starting annotations after an unannotated opening is rejected. Recordings without annotations remain supported. The shared component controls layout, progress, and transitions; see [window-chrome.md](window-chrome.md).

```js
await showAnnotation({
  title: 'What changed',
  body: 'The cursor stays visible above popup controls.',
  index: 1,
  total: 2,
})
await pause(1600)
await hideAnnotation()
```

Do not inject annotations into the application. Floating annotations and the old `type`, `position`, and `width` options are rejected with a migration error. Use the fixed panel component without scenario CSS. Check text fit, contrast, and timing in the rendered MP4, and include substantive explanation in the written PR walkthrough as a text alternative.

## Scenario module

Create the scenario outside the repository, for example `/tmp/payload-pr-demo-relationship-drawer.mjs`. It must export presentation metadata and default-export an async function:

```js
export const presentation = {
  change: {
    kind: 'Feature',
    title: 'Create a post',
    description: 'Open a new post from the collection list.',
  },
}

export default async function scenario({ baseURL, click, expect, page, pause, ready }) {
  await page.goto(`${baseURL}/admin/collections/posts`)

  const createButton = page.getByRole('link', { name: 'Create new Post' })
  await expect(createButton).toBeVisible()
  await ready()

  await click(createButton)
  await expect(page.getByRole('heading', { name: 'Create new Post' })).toBeVisible()
  await pause(1200)
}
```

Prefer existing seeded data. Prepare additional starting data through UI gestures before `ready()` or optional API fixture hooks. API seeding is useful for larger datasets and specific starting states; when creating content is itself part of the demonstration, show it through the Admin.

### Optional API fixtures

The `prepare-demo.mjs` command calls `setup({ request, baseURL, label })` before opening the walkthrough and passes its return value as `fixture` to the scenario. `teardown({ request, fixture, baseURL, label })` runs afterward, including when the walkthrough fails. Both hooks share an isolated Playwright API request context; authenticate it as needed. These hooks are outside the recorded interaction sequence.

```js
export async function setup({ request }) {
  const login = await request.post('/api/users/login', {
    data: { email: 'dev@payloadcms.com', password: 'test' },
  })
  if (!login.ok()) throw new Error(`Fixture login failed: ${login.status()}`)

  const response = await request.post('/api/posts', {
    data: { title: 'Autumn launch' },
  })
  if (!response.ok()) throw new Error(`Fixture creation failed: ${response.status()}`)
  return { post: (await response.json()).doc }
}

export async function teardown({ request, fixture }) {
  const response = await request.delete(`/api/posts/${fixture.post.id}`)
  if (!response.ok()) throw new Error(`Fixture cleanup failed: ${response.status()}`)
}
```

Candidate mode prepares and removes a separate fixture for validation and recording. Make hooks repeatable, use a dedicated demo database, and remove only records the hook created. If setup fails after partial creation, setup must undo that partial work itself; teardown runs only after setup succeeds. The lower-level recorder functions do not orchestrate hooks; use `prepare-demo.mjs` when a scenario exports them.

Use semantic locators where practical. Assert each important state before continuing so the recording fails instead of capturing the wrong screen. Let the final proof remain visible for at least a moment.

The recorder supplies:

- `baseURL`: normalized without a trailing slash;
- `click(locator, options?)`: smoothly moves to a locator, pauses, clicks, and pauses again;
- `expect`: Playwright assertions;
- `moveCursor(locator, options?)`: smoothly points at a locator and pauses without clicking;
- `page`: the application iframe facade; navigation, locators, and evaluation target the app, while input devices and page events use the recording page;
- `pause(milliseconds = 700)`: a short presentation pause;
- `ready()`: marks the loaded opening state and holds it for 1.2 seconds; call it exactly once before the first visible interaction;
- `typeText({ locator, text, clear = false, delay = 80 })`: click to focus, optionally select all with `ControlOrMeta+A`, then type character by character;
- `scroll(locator, options?)`: defaults to wheel input with the cursor inside the visible target; use `{ input: 'wheel', cursorPlacement: 'inside' }` for paced wheel scrolling with position verification;
- `showAnnotation(options)` / `hideAnnotation()`: updates or clears the step note in the shared chrome panel;
- `label`: the normalized recording label.

## Gesture-based interactions

The scenario drives the same controls a person uses:

- Open the starting route with one `page.goto()` before UI preparation and `ready()`. Reach subsequent routes by clicking visible links, navigation items, breadcrumbs, or buttons. Do not jump to known document URLs between steps.
- Use the recorder's `click` helper for pointer actions. Use `page.keyboard.press()` and `page.keyboard.type()` for shortcuts and paced typing after focusing the control with a click. Do not use `fill()`, `selectOption()`, synthetic event dispatch, or DOM value assignments.
- Use `scroll` with `input: 'wheel'` and `cursorPlacement: 'inside'` for visible scrolling. Reveal offscreen controls with a wheel gesture before clicking them; do not rely on locator auto-scrolling.
- In the scenario function, create and reset content through these same gestures, including UI preparation before `ready()`. Put optional API seeding and cleanup in `setup`/`teardown`, outside the walkthrough. Do not call REST endpoints, the Local API, application functions, or mutate browser storage to advance the demonstrated interaction.
- Locators, assertions, network observation, and read-only DOM measurements may verify state. Presentation annotations, window framing, recording, encoding, and verification are harness operations.

For example, edit a focused field through keyboard input:

```js
await click(page.getByRole('textbox', { name: 'Title', exact: true }))
await page.keyboard.press('ControlOrMeta+A')
await page.keyboard.type('Halloween Sale', { delay: 80 })
await click(page.getByRole('button', { name: 'Save', exact: true }))
```

If a refresh is part of the story, send the browser reload shortcut through keyboard input and assert the resulting UI. Do not call `page.reload()` to advance the application during the walkthrough. The shared refresh indicator remains available for recorder development and preview controls.

The recorder supplies cursor and click feedback automatically. Scenarios do not mount or style it. Keep the scenario on one page; separate browser-window stitching is outside this skill's current scope.

Use `click` for visible interactions instead of calling `locator.click()` directly. Its defaults are a 300 ms eased cursor movement plus a 300 ms dwell before and after the click. `moveCursor` uses the same travel time and pauses for 300 ms after arriving. Override an individual action when the story needs more time:

```js
await click(saveButton, { after: 900 })
await moveCursor(disabledDestination, { duration: 900, pauseAfter: 1200 })
```

Change the recording-wide defaults with `--mouse-move-ms` and `--interaction-pause-ms`. Keep a nonzero dwell for review recordings; faster values are mainly useful for recorder tests.

## Scroll with wheel gestures

Destructure `scroll` from the scenario argument and target the element whose `scrollTop` or `scrollLeft` changes, including an overflowing popup list. Always select wheel input and keep the pointer inside the target for real hit testing:

```js
await scroll(tabsScroller, {
  axis: 'x',
  to: 'end',
  duration: 950,
  input: 'wheel',
  cursorPlacement: 'inside',
})
await click(revealedTab)
```

For menus, click the trigger, wheel-scroll the actual overflowing list, then click the revealed item. Use a selector from the real markup. The helper sends small timed wheel deltas and verifies the resulting position; it never repairs a failed wheel gesture by assigning scroll offsets. Hover changes are expected. Choose a cursor position or pause that keeps the interaction readable rather than hiding tooltips or mutating application styles.

`click` and `moveCursor` target the visible, unobstructed part of a control and never auto-scroll. Both the pointer and click use the same outer-page coordinates, including iframe scaling. An optional `position: { x, y }` is relative to the control's padding box in application CSS pixels and never falls back to another point. Clicks wait for enabled, stable controls and recheck the actual pointer position after the dwell; if the target moves away or becomes covered, the take fails rather than reporting a successful click.

Wait for completed application state before the next gesture. A selected label may update before server-rendered form data arrives: start `page.waitForResponse()` before the selection click, await the relevant successful refresh response, then assert the resulting form values before typing. Match an item's name independently of status badges (for example a Merged badge) so repeat validation can find it.

The lower-level helper also supports `input: 'animation'` for recorder development. It assigns scroll offsets and is not permitted in feature demo scenarios. Raw wheel calls bypass the helper's pacing and verification; use the helper instead.

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
5. writes a six-frame contact sheet, a take-specific `.scenario.mjs` copy, and a JSON manifest containing metadata and hashes;
6. removes the intermediate WebM after successful packaging.

It ends at the local review gate and never uploads.

Candidate mode refuses to overwrite an existing MP4, script snapshot, contact sheet, or manifest. It also rejects packaging if the scenario source changed during the take. Use a new take-specific `--label` for a revision so previously reviewed evidence remains intact.

During scenario development, use the faster modes independently:

```bash
node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs validate \
  --scenario /tmp/payload-pr-demo-relationship-drawer.mjs

node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs preview \
  --scenario /tmp/payload-pr-demo-relationship-drawer.mjs \
  --label relationship-drawer
```

`validate` runs the scenario without video or interaction delays. `preview` writes one final-state PNG, including the cursor position, so cursor and layout changes do not require a full recording.

After asserting the first meaningful state, call `await ready()` before the first interaction. Candidate mode uses that marker to trim browser startup and leaves a 1.2-second hold on the loaded page. Recording fails if the marker is missing. Inspect the first frame of the candidate, especially after a cold server start.

Useful options:

- `--base-url http://localhost:4000`
- `--viewport 1280x720`
- `--output /tmp/custom-demo.mp4`
- `--mouse-move-ms 300`
- `--interaction-pause-ms 300`
- `--contact-sheet /tmp/custom-demo-contact-sheet.png`
- `--manifest /tmp/custom-demo.json`

The lower-level `record-demo.mjs` remains available for debugging the recorder itself. `convert-demo.mjs` is used internally by `prepare-demo.mjs` with the opening state marked by `ready()`. Use `prepare-demo.mjs` for PR demos so conversion, verification, and cleanup stay together.

## Review the recording script

Each candidate saves the scenario module beside its MP4 as `<video-name>.scenario.mjs`. The manifest records `scenarioSnapshot` and `scenarioSha256`; the original scenario path remains in `scenario`. Later edits to the working scenario do not change an earlier take's copy. The snapshot contains the scenario module, not its imported dependencies or the recorder runtime.

Present the script link alongside the video, using the absolute snapshot path, and open it in the Codex editor when available. Keep scenarios readable: use multi-line JavaScript and identify preparation, annotations, interactions, and assertions clearly. For another take, edit the working scenario and use a new label; preserve earlier snapshots with their videos.

## Review the candidate

The command prints the MP4, duration, size, SHA-256, script snapshot, contact sheet, and manifest paths. Inspect the contact sheet first, then watch the entire video. Confirm that the opening frame is meaningful, actions are readable, no sensitive data is visible, and the final state proves the feature. Show the local MP4 and a clickable script snapshot link to the user, then stop for review.

If the file exceeds 10 MB, shorten the scenario first. Adjusting conversion quality with the lower-level converter is secondary. Do not silently raise the size budget because the applicable GitHub limit depends on the repository's plan and the uploader's access.

## Accessibility observations

Opt in per scenario:

```js
export const presentation = {
  accessibility: true,
  change: {
    kind: 'Fix',
    title: 'Reorder sections with the keyboard',
    description: 'Follow keyboard commands and movement announcements.',
  },
}
```

Set `presentation.accessibility: true` to show navigation keys and shortcuts. Ordinary character typing, spaces typed into editable fields, and input originating in password fields or `[data-private]` containers are excluded. Command history resets on navigation or presentation reset.

Also set `presentation.showAnnouncements: true` to display observed live-region text. This captures DOM text, not actual screen-reader audio. Feedback remains available when the step note is hidden. The recorder preserves application focus and native focus styling; it adds no focus outline.

Use real keyboard events such as `page.keyboard.press('Tab')` and `page.keyboard.press('Enter')`, with pauses around important commands. Long announcements and older history may truncate, so verify the relevant evidence in the finished take. Preview with `?accessibility&announcements&kind=fix`; layout and styling come from the shared component.

### Reuse a scenario with or without a11y feedback

Pass `--a11y on` or `--a11y off` to `prepare-demo.mjs` for candidate, preview, or validate mode, or to `record-demo.mjs`. `on` enables the integrated feedback, key history, and observed announcement captions; `off` disables the entire a11y presentation and observer. Omitting the flag preserves `presentation.accessibility` and `presentation.showAnnouncements`. These options do not change application accessibility or the walkthrough script. Use different take labels to keep each result reviewable. The candidate manifest records the override, cursor timing, click pauses, and viewport alongside the unchanged scenario snapshot.

```sh
node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs candidate --scenario /tmp/demo.mjs --a11y on --label demo-a11y
node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs candidate --scenario /tmp/demo.mjs --a11y off --label demo-clean
```

### Capture resolution and encoding

The default canvas fits the initial application viewport at 1:1 scale, including space for chrome and annotations. A 1440×900 viewport produces a 1600×1148 video, or 1600×1188 with accessibility feedback. The canvas stays fixed during responsive resizing. An explicit `presentation.canvas` overrides those dimensions and can scale the app to fit. `--viewport` controls the application iframe's CSS dimensions.

The MP4 converter uses H.264 CRF 18 to preserve detail through conversion. The existing 10 MB review/upload budget still applies.
