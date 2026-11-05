# Shared recording chrome

The preview, validation, and recording mount the same browser component: [WindowChrome/index.mjs](../scripts/WindowChrome/index.mjs). That component is the source of truth for layout, styling, and animation. Scenarios supply presentation data and interactions; do not recreate the chrome or add scenario CSS.

## Iterate without rendering video

```bash
node .agents/skills/record-pr-demo/scripts/preview-chrome.mjs
```

Open `http://127.0.0.1:4400`. Use `--port 4401` if needed. The server binds to loopback and serves only the preview assets. Edits appear on reload.

The preview contains a sample application, not Payload Admin. Use its viewport controls and timeline to inspect resizing. Light and Dark switch the chrome and sample application together, preserving the current viewport and timeline position. Query options include `?theme=dark`, `?kind=fix`, and `?accessibility&announcements&kind=fix`. Review real application behavior in a scenario against the relevant Payload server.

## Required scenario metadata

Every scenario must export `presentation`; missing metadata or `presentation: false` fails before the browser starts.

```js
export const presentation = {
  change: {
    kind: 'Feature', // 'Feature' or 'Fix'
    title: 'Responsive collection lists',
    description: 'Browse and manage content on desktop, tablet, and mobile.',
  },
  // Optional canvas override: even dimensions, at least 800×600.
  theme: 'light', // 'light' or 'dark', fixed for the take
  accessibility: false,
  showAnnouncements: false,
}
```

`--viewport` sets the initial application's CSS viewport. By default, the canvas fits that viewport at native scale, with room for the chrome and description: 1600×1148 for the default 1440×900 viewport, or 1600×1188 with accessibility feedback. It stays fixed during responsive resizing. An explicit `presentation.canvas` overrides both the composition and encoded video dimensions and may scale the app to fit. See [capture resolution and encoding](recording.md#capture-resolution-and-encoding).

The window header automatically displays the current application viewport dimensions and updates them during resizing.

## URL bar

The window header shows the live application URL, including its query string and hash. It follows document navigation and History API changes, including browser Back. It is read-only and does not change the application's URL. Credentials in URLs are omitted; non-web content shows only its protocol. The live preview uses the same bar.

## History buttons

Back and Forward in the window header navigate the application's own frame history. Buttons disable when that direction is unavailable. Scenarios use `await click(chrome.back)` and `await click(chrome.forward)` so the cursor visibly clicks the controls. They share the standard cursor movement, dwell and click feedback.

## Presentation helpers

- `showAnnotation({ title, body, index = 1, total = 1 })` replaces the step note. Pagination is one-based; the change title and description stay constant.
- `hideAnnotation()` clears the step note while preserving the change description and any enabled accessibility feedback.
- `setAnnotation` and `clearAnnotation` are compatibility aliases. `setAnnotation(null)` also clears the note; prefer `showAnnotation` and `hideAnnotation` in new scenarios.
- `resizeWindow({ width, height, duration = 1000 })` animates the actual iframe viewport. Await it before another resize. Dimensions must be positive integers up to 7680×4320. Use it only when responsive reflow is part of the story.
- `page` scopes navigation, locators, and evaluation to the application iframe; input devices, context, and page events belong to the containing recording page. `page.addInitScript` installs context-wide scripts for subsequent navigations. `page.goBack()` and `page.goForward()` are unsupported because browser history is shared with the wrapper.

Floating annotations and `type`, `position`, and `width` options are unsupported. Overlong change text fails at mount; an oversized step is rejected without replacing the previous note. Shorten the supplied text instead of overriding the layout. Supplied content is inserted as text, not markup.

The component handles progress, transitions, reduced motion, and feedback visibility. Validation and screenshot preview apply presentation updates immediately. Inspect the final MP4 for legibility and pacing; do not duplicate the renderer's visual rules in scenario instructions.

For scenario examples, gesture requirements, and optional accessibility observations, see [recording.md](recording.md).

## Capture architecture

The recorder captures one browser page containing the chrome and a live application iframe. A locally intercepted wrapper URL uses the application's origin. Application security headers remain intact; applications that prohibit framing cannot be recorded with this tool.

Resizing changes the iframe's CSS dimensions, so responsive breakpoints run at their real widths. The component scales the surrounding window uniformly to fit the composition. There is no screenshot relay or second app browser context.

`ready()` and final screenshots wait for the composed page to render. Layout is shared across modes, but network requests, application animations, browser scheduling, and encoded bytes are not deterministic. Use assertions and repeatable starting data as described in [recording.md](recording.md).

## Refresh feedback

`await page.reload()` is a lower-level harness capability that reloads only the application iframe and reports loading, success, or failure in the chrome. Navigation and HTTP errors propagate to the scenario. Await a reload before starting another. Feature walkthroughs click `chrome.refresh` when demonstrating refresh; see the [gesture contract](recording.md#gesture-based-interactions).

The **Refresh frame** button sits between Forward and the URL bar in both preview and recordings. It stays visible and dim when idle, spins while the app reloads, and returns to the same dim icon afterward. Scenarios can click it with `await click(chrome.refresh)`. The playground’s **Simulate refresh** control reloads the frame with a brief minimum loading duration so the spinner is easy to inspect. Application-initiated navigations are not labeled as recorder refreshes.

## Verification and accessibility boundaries

```bash
node --test .agents/skills/record-pr-demo/scripts/*.test.mjs
```

Browser tests mount the actual component. They cover resizing, annotation validation and transitions, reduced motion, focus preservation, conditional dividers, keyboard history, and refresh feedback. Recorder integration checks the live iframe, encoded dimensions and pixels, video decode, and fast validation. Preview tests exercise keyboard controls and narrow host viewports.

Accessibility evidence is scoped to the recording chrome and preview controls. Relevant WCAG 2.2 A/AA criteria include decorative feedback (1.1.1), structure and labels (1.3.1), non-color progress cues (1.4.1), preview reflow (1.4.10), keyboard operation (2.1.1), playback control (2.2.2), focus preservation (2.4.3, 2.4.7, 2.4.11), control semantics (4.1.2), and status updates (4.1.3). Automated evidence does not establish product or video conformance. Review contrast (1.4.3, 1.4.11), text resizing and spacing (1.4.4, 1.4.12), target sizes (2.5.8), visual focus, timing, and exact screen-reader announcements in their relevant rendered contexts.

Accessibility feedback observes DOM text, not screen-reader audio. It is hidden from assistive technology, does not intercept input, and adds no application focus outline. Previous-command history is intentionally faded; do not rely on it as the sole evidence of a keyboard action. The scaled preview is not an accessible replacement for operating the application.
