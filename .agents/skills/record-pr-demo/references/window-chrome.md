# Shared recording chrome

Use presentation mode for a fixed video canvas containing a genuinely resizable application window. The chrome is a dependency-free browser component at `scripts/WindowChrome/index.mjs`; the live preview and recorded presentation mount that same component. Scenario scripts supply text, pagination, dimensions, and timing. They do not generate CSS.

## Iterate without rendering video

From the repository root:

```bash
node .agents/skills/record-pr-demo/scripts/preview-chrome.mjs
```

Open `http://127.0.0.1:4400`. Add `?theme=dark` to preview dark chrome. The annotation panel matches the chrome theme: light in light mode and dark in dark mode, including text, divider, and the unfilled progress track. The panel uses the paper background in both themes (white in light mode, deep dark in dark mode), without an outer border. Use `--port 4401` if necessary. The server binds only to loopback and serves a fixed set of preview assets. No Payload server, Playwright browser, ffmpeg, or installation is needed to view it in your browser.

The preview uses a clearly isolated responsive sample collection page, not a running Payload Admin. Switch desktop/tablet/mobile, scrub the timeline, or play the resize. Add `?kind=fix` to preview the yellow Fix badge, or `?theme=dark&kind=fix` for its dark variant. A timeline position always maps to the same viewport and note. The exported video's dimensions remain fixed. Edit the shared component and reload to review styling changes; do not generate a video for each iteration.

## Required scenario metadata

Every scenario must include a named `presentation` export. Missing metadata or `presentation: false` fails before the browser starts. There is no unframed mode:

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

- `page`, `click`, `moveCursor`, and `scroll` operate inside the live application iframe. `showAnnotation`/`hideAnnotation` control the chrome panel without inserting an overlay into the app. Popovers and dialogs are captured with it. `page` scopes navigation, locators, and evaluation to that frame; mouse, keyboard, context, and page events use the containing page. `page.addInitScript` installs context-wide scripts for subsequent navigations. `page.reload()` reloads only the app. `page.goBack()` and `page.goForward()` are unsupported because browser history is shared with the wrapper. Open the initial route before preparation with `page.goto()`, then use visible UI links and controls for navigation, as required by the [gesture interaction contract](recording.md#gesture-based-interactions).
- `resizeWindow({ width, height, duration = 1000 })` changes the real viewport with smoothstep easing. Await it before starting another resize. Positive integer dimensions up to 7680×4320 are accepted, including mobile widths. Fast validation and screenshot preview apply the final viewport immediately.
- `showAnnotation({ title, body, index = 1, total = 1 })` replaces the current note. Pagination is one-based and defaults to a single note; a continuous progress ring is the visible indicator, while visually hidden text such as “Step 1 of 3” conveys the exact position to assistive technology. The filled fraction follows the current step divided by the total using `--color-bg-brand` (Payload primary blue by default). The ring is decorative; the visually hidden step count remains available to assistive technology. The ring is shown only when there are two or more annotations. There are no gaps between steps; the final step fills the entire ring. Forward step changes ease the ring fill over 650ms; backward changes, new step sequences, and the first annotation apply immediately. Reduced-motion preferences disable this transition. Fast validation and screenshot preview also apply the final fill immediately. The change title and description remain constant.
- The first visible annotation and any return to step 1 appear immediately at full opacity, including after annotations are hidden. Later step titles and descriptions crossfade over 180ms when they change or clear; the ring and persistent change heading do not fade. Repeated identical notes do not restart the animation. Outgoing visual text is hidden from assistive technology and removed after the transition. Reduced motion and fast validation/preview apply text immediately.
- `hideAnnotation()` clears only the step note. The fixed annotation panel and change description remain visible.
- `setAnnotation` and `clearAnnotation` remain compatibility aliases for `showAnnotation` and `hideAnnotation`; `setAnnotation(null)` also clears the note. Use `showAnnotation`/`hideAnnotation` in new scripts.
- Floating annotations are removed. `type`, `position`, and `width` options are rejected; remove those fields and supply the note title/body instead. There is no placement selector or fallback renderer.
- Every recorder mode uses chrome and exposes these helpers. Existing scripts must add the required `presentation` metadata before running.

The annotation panel sits above the window and reserves a fixed 112px height, or 168px with integrated accessibility feedback. Overlong change text fails at mount; an overlong step note is rejected with a request to shorten it, preserving the previous note and the composition. Use concise text that fits the annotation panel. The component inserts all supplied text as text, not markup. The application scales uniformly to fit its reserved region; it is never stretched to the canvas ratio.

## How capture works

Presentation mode records one fixed-size browser page containing the chrome and a real application iframe in its content slot. A locally intercepted wrapper URL uses the application's origin, so same-origin framing policies continue to apply. The recorder does not remove application security headers; applications that prohibit framing cannot be recorded with this tool.

`resizeWindow` animates the iframe's actual CSS dimensions with requestAnimationFrame. The browser lays out the application at those dimensions and composites it with the surrounding window in the same recorded page. There is no screenshot relay, JPEG decoding, or second browser context. The component scales the complete window uniformly when necessary to fit the fixed canvas, preserving the application's proportions. Responsive breakpoints still change the application's layout at their real widths.

`ready()` and final screenshots wait two animation frames for the composed page to render. The existing video converter, contact sheet, manifest, hashing, size budget, and approval workflow apply to the composed output. The timeline mapping and chrome layout are deterministic; network requests, application animations, browser scheduling, and encoded bytes are not made deterministic by this wrapper. Continue using assertions and seeded data for real demo scenarios.

## Verification

```bash
node --test .agents/skills/record-pr-demo/scripts/*.test.mjs
```

Component tests mount the actual shared renderer and assert the iframe viewport follows every sampled window size during animation. Recorder integration checks a single page/context with no image capture, genuine responsive reflow, fixed encoded dimensions, final captured pixels, complete video decode, and fast validation. Preview integration checks keyboard scrubbing, annotation hiding while preserving the title, reduced-motion behavior, and a narrow host viewport.

Accessibility scope: presentation chrome and preview controls, not Payload Admin or video conformance. Assessed WCAG 2.2 A/AA: 1.3.1 (structure/labels), 1.4.1 (arc extent conveys progress independently of hue; hidden text supplies exact steps), 1.4.10 (preview controls at 320px), 2.1.1 (keyboard timeline), 2.2.2 (user-initiated playback with pause), 4.1.2 (native controls and pressed states), and 4.1.3 (polite note/status updates). Native focus styles are preserved; visual focus quality (2.4.7/2.4.11), contrast (1.4.3/1.4.11), text spacing/resizing (1.4.4/1.4.12), target sizes (2.5.8), and screen-reader announcements still need human review. The miniature canvas intentionally scales as a video preview; it is not an accessible replacement for operating the app itself. No claim of product or video conformance is made.

The annotation API browser integration covers panel-only rendering, rejection of legacy placement options without replacing the previous note, focus preservation, stable geometry, clearing, and immediate fast-mode updates. Recorder tests reject missing or disabled chrome in all modes. Progress and text-motion checks exercise intermediate/final states, reduced motion, unchanged-note deduplication, and cleanup of outgoing text. The ring and temporary outgoing text layers are decorative and hidden from assistive technology (1.1.1); current step text stays in the polite live region (4.1.3). Exact spoken announcements remain a manual screen-reader check.

Click-feedback scope: the recorded mouse press has an automatic decorative ring in the existing cursor popover. Browser evidence covers popup-layer placement, brand color inheritance, fixed click position, rapid-click replacement, cleanup, and no expansion under reduced motion. It is aria-hidden and pointer-events:none, adds no control or focus stop, and does not prevent input (WCAG 1.1.1, 2.1.1, 4.1.2). Perceptibility and timing are reviewed in the resulting recording; these checks do not establish overall video conformance.

## Refresh feedback

`await page.reload()` is a lower-level harness capability for recorder development; feature demos use keyboard input when showing a refresh. It reloads the application iframe while the surrounding chrome stays in place. The window header shows a rotating refresh icon beside the optional dimensions badge, then a checkmark for 650ms. Status text is available to screen readers without a visible label. The refreshing state remains visible for at least 300ms in paced recordings; validation skips that presentation delay. Navigation errors and HTTP errors show a failure icon, announce “Refresh failed”, and propagate to the scenario. Await a reload before starting another.

The live preview’s **Refresh frame** control performs a real iframe reload. It works alongside the Desktop, Tablet, Mobile, dimensions, and resize timeline controls. The icon has a polite screen-reader status message, never moves focus, and stops spinning under reduced motion. This indicator covers recorder `page.reload()` calls; application-initiated navigations are not labeled as refreshes.

## Change-kind badge

`Feature` uses a pale brand-blue badge and `Fix` uses a pale warning-yellow badge above the change title. Colors use the `--color-bg-*-tertiary`, `--color-border-*`, and `--color-text-*` semantic families, with matching Payload palette fallbacks for the standalone preview. Badge text mixes its semantic color with the theme ink to preserve small-text contrast. The badge keeps the original 12px text size and 18px total label height, so the fixed panel and two-line description retain their existing space. Browser measurements cover both labels in light and dark themes with the comparison video's title and description; neither state overflows.

Accessibility assessment: WCAG 2.2 A/AA 1.3.1 retains readable label text and the existing heading structure; 1.4.1 keeps the explicit kind name rather than relying on color; 1.4.3 measured text contrast is 5.66:1 for Feature and 5.75:1 for Fix in light mode, and 6.20:1 and 7.24:1 respectively in dark mode. The badge adds no interactive control or focus stop. The 17 existing chrome, presentation, and preview checks pass, including stable geometry, resizing, and focus preservation. Visual judgement of badge prominence and legibility at the final video playback size remains part of take review. No new text-resize, text-spacing, screen-reader, or product-conformance claim is made; the preview's scaling boundary above still applies.

### Accessibility observation mode evidence

The optional accessibility feedback is recording chrome, not a change to Payload's accessible behavior. The recorder adds no focus outline, focus geometry reports, or focus-tracking animation loop. Browser regressions assess keyboard operation and focus order (WCAG 2.1.1 and 2.4.3), preservation of application focus styling and obstruction avoidance (2.4.7 and 2.4.11), decorative feedback semantics (4.1.2), and non-duplicated status observations (4.1.3). They cover native keyboard input, private typing, unchanged application focus and outline styles at scaled sizes and in modal dialogs, enabled/disabled mode, live-region availability, navigation, reloads, bounded key history, and observer shutdown. Feedback is pointer-transparent and uses `aria-hidden` without adding live announcements.

With accessibility enabled, the annotation panel reserves 168px: change description and current step above, then one full-width feedback row below a horizontal divider. The row has a blue `a11y` badge matching the Feature badge, followed by a speaking-person icon and one line of observed text on the left when `showAnnouncements: true`. Animated key history sits on the right, separated by a vertical divider. Unusually long announcement text ellipsizes to preserve the single-line layout. The latest command is first and emphasized, followed by up to three previous commands in muted but contrasting colors. Commands persist until navigation or a presentation reset. Combinations retain separate keycaps and plain plus separators. Oldest entries may clip when horizontal space is limited. The row remains visible when the step annotation is hidden; `--a11y off` removes all feedback. Geometry regressions check that the row spans the panel below both main sections, captions and history share a horizontal centerline, and feedback never covers the application or shifts the window when commands arrive. Neutral keycaps reference Payload semantic background, border, and text tokens with matching palette fallbacks.

When a command arrives, retained commands slide right from their current visible positions over 220ms while the new command enters from the left. Rapid input interrupts and resumes from the current visual positions. Reduced-motion preferences and fast validation/preview apply the final positions immediately. Navigation reset and destruction cancel pending key animations.
