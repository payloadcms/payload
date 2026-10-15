# Shared recording chrome

Use presentation mode for a fixed video canvas containing a genuinely resizable application window. The chrome is a dependency-free browser component at `scripts/WindowChrome/index.mjs`; the live preview and recorded presentation mount that same component. Scenario scripts supply text, pagination, dimensions, and timing. They do not generate CSS.

## Iterate without rendering video

From the repository root:

```bash
node .agents/skills/record-pr-demo/scripts/preview-chrome.mjs
```

Open `http://127.0.0.1:4400`. Add `?theme=dark` to preview dark chrome. The annotation panel matches the chrome theme: light in light mode and dark in dark mode, including text, divider, and the unfilled progress track. The panel uses the paper background in both themes (white in light mode, deep dark in dark mode), without an outer border. Use `--port 4401` if necessary. The server binds only to loopback and serves a fixed set of preview assets. No Payload server, Playwright browser, ffmpeg, or installation is needed to view it in your browser.

The preview uses a clearly isolated responsive sample collection page, not a running Payload Admin. Switch desktop/tablet/mobile, scrub the timeline, or play the resize. A timeline position always maps to the same viewport and note. The exported video's dimensions remain fixed. Edit the shared component and reload to review styling changes; do not generate a video for each iteration.

## Opt a recording scenario into presentation mode

Add a named `presentation` export to an otherwise normal scenario:

```js
export const presentation = {
  change: {
    kind: 'Feature', // 'Feature' or 'Fix'
    title: 'Responsive collection lists',
    description: 'Browse and manage content on desktop, tablet, and mobile.',
  },
  canvas: { width: 1600, height: 1000 }, // default; even dimensions, at least 800×600
  showSize: true, // default
  theme: 'light', // default; 'light' or 'dark', fixed for the take
}

export default async function scenario({
  baseURL,
  expect,
  page,
  pause,
  ready,
  resizeWindow,
  showAnnotation,
}) {
  await page.goto(`${baseURL}/admin/collections/posts`)
  await expect(page.getByRole('heading', { name: 'Posts', exact: true })).toBeVisible()
  await showAnnotation({
    index: 1,
    total: 2,
    title: 'Start with the full layout',
    body: 'The collection list has room for navigation and document details.',
  })
  await ready()
  await resizeWindow({ width: 390, height: 720, duration: 1200 })
  await showAnnotation({
    index: 2,
    total: 2,
    title: 'Check the compact layout',
    body: 'Inspect the result at a real 390px application viewport.',
  })
  await pause(1200)
}
```

Run the existing candidate command with `--viewport 1280x720` for that opening application size. `--viewport` controls the initial application viewport, while `presentation.canvas` controls the encoded video dimensions. Keep the existing opening `ready()` marker and final-file review gate.

- `page`, `click`, `moveCursor`, and `scroll` operate inside the live application iframe. `showAnnotation`/`hideAnnotation` control the chrome panel when presentation is enabled, without inserting a floating overlay into the app. Popovers and dialogs are captured with it. In presentation mode, `page` scopes navigation, locators, and evaluation to that frame; mouse, keyboard, context, and page events use the containing page. `page.addInitScript` installs context-wide scripts for subsequent navigations. `page.reload()` reloads only the app. `page.goBack()` and `page.goForward()` are unsupported because browser history is shared with the wrapper; use explicit `page.goto()` navigation.
- `resizeWindow({ width, height, duration = 1000 })` changes the real viewport with smoothstep easing. Await it before starting another resize. Positive integer dimensions up to 7680×4320 are accepted, including mobile widths. Fast validation and screenshot preview apply the final viewport immediately.
- `showAnnotation({ title, body, index = 1, total = 1 })` replaces the current note. Pagination is one-based and defaults to a single note; a continuous progress ring is the visible indicator, while visually hidden text such as “Step 1 of 3” conveys the exact position to assistive technology. The filled fraction follows the current step divided by the total using `--color-bg-brand` (Payload primary blue by default). The ring is decorative; the visually hidden step count remains available to assistive technology. The ring is shown only when there are two or more annotations. There are no gaps between steps; the final step fills the entire ring. Forward step changes ease the ring fill over 650ms; backward changes, new step sequences, and the first annotation apply immediately. Reduced-motion preferences disable this transition. Fast validation and screenshot preview also apply the final fill immediately. The change title and description remain constant.
- Step titles and descriptions crossfade over 180ms when they appear, change, or clear; the ring and persistent change heading do not fade. Repeated identical notes do not restart the animation. Outgoing visual text is hidden from assistive technology and removed after the transition. Reduced motion and fast validation/preview apply text immediately.
- `hideAnnotation()` clears only the step note. The fixed annotation panel and change description remain visible.
- `setAnnotation` and `clearAnnotation` remain compatibility aliases for `showAnnotation` and `hideAnnotation` in presentation mode; `setAnnotation(null)` also clears the note. Use `showAnnotation`/`hideAnnotation` in new scripts.
- Legacy `showAnnotation({ type: 'floating', ... })` calls route into the panel when chrome is enabled. Position and width are ignored; an omitted legacy title becomes “Note”. Optional `type: 'panel'` explicitly selects the new mode. Other types are rejected.
- Scenarios without `presentation` keep the existing floating-only `showAnnotation`/`hideAnnotation` API, including required `type: 'floating'` and placement. The presentation aliases and `resizeWindow` are available only with chrome.

The annotation panel sits above the window and reserves a fixed 112px height. Overlong change text fails at mount; an overlong step note is rejected with a request to shorten it, preserving the previous note and the composition. Use concise text that fits the annotation panel. The component inserts all supplied text as text, not markup. The application scales uniformly to fit its reserved region; it is never stretched to the canvas ratio.

## How capture works

Presentation mode records one fixed-size browser page containing the chrome and a real application iframe in its content slot. A locally intercepted wrapper URL uses the application's origin, so same-origin framing policies continue to apply. The recorder does not remove application security headers; applications that prohibit framing cannot use presentation mode.

`resizeWindow` animates the iframe's actual CSS dimensions with requestAnimationFrame. The browser lays out the application at those dimensions and composites it with the surrounding window in the same recorded page. There is no screenshot relay, JPEG decoding, or second browser context. The component scales the complete window uniformly when necessary to fit the fixed canvas, preserving the application's proportions. Responsive breakpoints still change the application's layout at their real widths.

`ready()` and final screenshots wait two animation frames for the composed page to render. The existing video converter, contact sheet, manifest, hashing, size budget, and approval workflow apply to the composed output. The timeline mapping and chrome layout are deterministic; network requests, application animations, browser scheduling, and encoded bytes are not made deterministic by this wrapper. Continue using assertions and seeded data for real demo scenarios.

## Verification

```bash
node --test .agents/skills/record-pr-demo/scripts/*.test.mjs
```

Component tests mount the actual shared renderer and assert the iframe viewport follows every sampled window size during animation. Recorder integration checks a single page/context with no image capture, genuine responsive reflow, fixed encoded dimensions, final captured pixels, complete video decode, and fast validation. Preview integration checks keyboard scrubbing, annotation hiding while preserving the title, reduced-motion behavior, and a narrow host viewport.

Accessibility scope: presentation chrome and preview controls, not Payload Admin or video conformance. Assessed WCAG 2.2 A/AA: 1.3.1 (structure/labels), 1.4.1 (numbered steps independent of color), 1.4.10 (preview controls at 320px), 2.1.1 (keyboard timeline), 2.2.2 (user-initiated playback with pause), 4.1.2 (native controls and pressed states), and 4.1.3 (polite note/status updates). Native focus styles are preserved; visual focus quality (2.4.7/2.4.11), contrast (1.4.3/1.4.11), text spacing/resizing (1.4.4/1.4.12), target sizes (2.5.8), and screen-reader announcements still need human review. The miniature canvas intentionally scales as a video preview; it is not an accessible replacement for operating the app itself. No claim of product or video conformance is made.

Segmented progress accessibility: assessed WCAG 2.2 A/AA 1.1.1 (the redundant graphic is hidden from assistive technology), 1.3.1 and 1.4.1 (visually hidden step text conveys progress to assistive technology; the visible filled arc conveys proportion without relying on hue), 1.4.11 (the decorative ring is not required to understand progress), and 4.1.3 (the existing polite note region includes the visually hidden step count). Browser inspection confirmed the first, middle, and final fill states and `aria-hidden`; the six component/preview tests passed. Visual review covered those three light-theme states. Exact screen-reader announcements and the existing dark-theme/contrast review remain outside this change’s verified evidence.

Ring motion verification: seven component/preview browser tests pass, including an assertion against an intermediate rendered fill, its completed state, immediate backward changes, and immediate reduced-motion changes. This covers the short user-initiated animation and reduced-motion behavior; the decorative graphic remains hidden from assistive technology (WCAG 1.1.1), and exact step text remains in the polite live region (4.1.3). No additional keyboard control is introduced.

Unified annotation API evidence: all 53 recorder tests pass. The browser integration verifies focus remains in the editor, the panel is outside the responsive iframe, legacy calls produce no floating overlay, validation failures preserve the previous note, and clearing a note preserves the change description. Applicable WCAG 2.2 A/AA checks include 1.1.1 (decorative ring), 1.3.1 (separate change/step structure), 1.4.1 (progress conveyed by arc extent as well as hidden exact text), 2.1.1 (unchanged keyboard focus), and 4.1.3 (polite step updates). Exact synthesized announcements remain a manual screen-reader check; automated focus/text assertions do not establish spoken output.

Text fade verification: all 54 recorder tests pass, including appearance, replacement, clearing, stable geometry, unchanged-note deduplication, outgoing visual-layer cleanup, and reduced-motion behavior. The temporary visual layers use `aria-hidden` and do not take focus (WCAG 1.1.1, 2.1.1); the live region retains only the current semantic step text (4.1.3). Exact spoken announcements still require screen-reader review.
