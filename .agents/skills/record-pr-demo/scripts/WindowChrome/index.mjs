/** Shared presentation surface. Scenarios supply content, never presentation CSS. */
export function mountDemoChrome({
  root,
  change,
  viewport = { width: 1280, height: 720 },
  theme = 'light',
  onNavigate,
  onRefresh,
  shouldAnimateAnnotations = true,
  accessibility = false,
  showAnnouncements = false,
  canvas = getDefaultCanvas({ viewport, accessibility }),
}) {
  validateSize({ ...canvas, name: 'Canvas' })
  validateSize({ ...viewport, name: 'Viewport' })
  if (canvas.width < 800 || canvas.height < 600 || canvas.width % 2 || canvas.height % 2) {
    throw new Error('Canvas must be at least 800×600 with even dimensions')
  }
  if (!['light', 'dark'].includes(theme)) throw new Error('Theme must be light or dark')
  if (
    !change ||
    !['Feature', 'Fix'].includes(change.kind) ||
    !change.title?.trim() ||
    !change.description?.trim()
  ) {
    throw new Error('Presentation requires kind (Feature or Fix), title, and description')
  }
  if (typeof accessibility !== 'boolean')
    throw new Error('Presentation accessibility must be a boolean')
  if (typeof showAnnouncements !== 'boolean')
    throw new Error('Presentation showAnnouncements must be a boolean')
  const hasAnnouncements = accessibility && showAnnouncements
  const shadow = root.attachShadow({ mode: 'open' })
  shadow.innerHTML = `<style>
    :host { display:block; position:relative; width:100%; aspect-ratio:${canvas.width}/${canvas.height}; font:16px/1.5 system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
    * { box-sizing:border-box; }
    [hidden] { display:none; }
    .stage { position:absolute; inset:0 auto auto 0; width:${canvas.width}px; height:${canvas.height}px; transform-origin:top left; overflow:hidden; color:var(--ink); background:var(--stage); }
    .light { --paper:#fff; --ink:#252422; --sub:#66635e; --stage:#f1f0ed; --shell:#e7e5e0; --line:#00000016; --rim:#ffffffa6; --badge:#ffffff70; --progress-track:#00000020; }
    .dark { --paper:#191919; --ink:#ededeb; --sub:#bbb8b0; --stage:#232321; --shell:#333330; --line:#ffffff22; --rim:#ffffff12; --badge:#ffffff0b; --progress-track:#ffffff30; }
    .light { --kind-feature-bg:var(--color-bg-brand-tertiary,#e5f4ff); --kind-feature-border:var(--color-border-brand,#bde3ff); --kind-feature-text:color-mix(in srgb,var(--color-text-brand,#007be5) 70%,var(--ink)); --kind-fix-bg:var(--color-bg-warning-tertiary,#fff1c2); --kind-fix-border:var(--color-border-warning,#f5dfa8); --kind-fix-text:color-mix(in srgb,var(--color-text-warning,#b86200) 70%,var(--ink)); }
    .dark { --kind-feature-bg:var(--color-bg-brand-tertiary,#394360); --kind-feature-border:var(--color-border-brand,#536383); --kind-feature-text:color-mix(in srgb,var(--color-text-brand,#80caff) 70%,var(--ink)); --kind-fix-bg:var(--color-bg-warning-tertiary,#5c4100); --kind-fix-border:var(--color-border-warning,#7a5800); --kind-fix-text:color-mix(in srgb,var(--color-text-warning,#ffd966) 70%,var(--ink)); }
    .light { --keycap-bg:var(--color-bg-secondary,#f5f5f5); --keycap-border:var(--color-border,#e6e6e6); --keycap-text:var(--color-text,rgba(0,0,0,.9)); }
    .dark { --keycap-bg:var(--color-bg-secondary,#383838); --keycap-border:var(--color-border,#444444); --keycap-text:var(--color-text,#fff); }
    .window { position:absolute; padding:10px; border:1px solid var(--rim); border-radius:18px; background:var(--shell); transform-origin:top left; }
    .header { height:36px; display:flex; align-items:center; justify-content:flex-start; padding:0 0 8px; gap:8px; }
    .history { display:flex; align-items:center; gap:3px; }
    .history button { display:grid; place-items:center; width:28px; height:28px; padding:0; border:0; border-radius:6px; background:transparent; color:var(--ink); cursor:pointer; }
    .history button:hover:not(:disabled) { background:var(--badge); }
    .history button:disabled, .history .refresh { color:var(--sub); opacity:.35; }
    .history button:disabled { cursor:default; }
    .history button:focus-visible { outline:2px solid #0d99ff; outline-offset:1px; }
    .history svg { width:17px; height:17px; pointer-events:none; }
    .address { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; border:1px solid var(--line); border-radius:7px; padding:3px 9px; background:var(--badge); color:var(--sub); font:12px/1.5 ui-monospace,monospace; }
    .history .refresh:hover, .history .refresh:focus-visible, .history .refresh[data-spinning] { opacity:1; }
    .refresh[data-spinning] svg { animation:refresh-spin 650ms linear infinite; }
    @keyframes refresh-spin { to { transform:rotate(360deg); } }
    @media (prefers-reduced-motion:reduce) { .refresh[data-spinning] svg { animation:none; } }
    .size { flex:none; padding:3px 9px; border:1px solid var(--line); border-radius:7px; background:var(--badge); color:var(--sub); font:12px/1.5 ui-monospace,monospace; font-variant-numeric:tabular-nums; }
    .content { position:relative; overflow:hidden; border-radius:8px; background:var(--paper); }
    ::slotted([slot=content]) { display:block; width:100%; height:100%; border:0; }
    .footer { position:absolute; top:32px; left:50%; transform:translateX(-50%); width:min(1302px,calc(100% - 64px)); height:${accessibility ? 144 : 104}px; display:grid; grid-template-rows:${accessibility ? '32px minmax(0,1fr) 36px' : '32px minmax(0,1fr)'}; row-gap:4px; grid-template-columns:minmax(0,1fr); align-items:center; padding:12px 24px; border:1px solid var(--line); border-radius:12px; color:var(--ink); background:var(--paper); }
    .change { grid-row:1; min-width:0; min-height:0; align-self:stretch; display:flex; align-items:center; gap:12px; margin-inline:-24px; margin-block-start:-12px; padding:12px 24px; border-radius:11px 11px 0 0; background:var(--color-bg-secondary,var(--keycap-bg)); white-space:nowrap; }
    .footer:has(.note:not([hidden]),.accessibility:not([hidden])) .change { border-block-end:1px solid var(--line); }
    .change .kind { align-self:center; flex:none; }

    .kind { align-self:flex-start; padding-inline:6px; border:1px solid var(--kind-border); border-radius:4px; background:var(--kind-bg); color:var(--kind-text); font-size:13px; font-weight:500; line-height:16px; }
    .kind[data-kind="Feature"] { --kind-bg:var(--kind-feature-bg); --kind-border:var(--kind-feature-border); --kind-text:var(--kind-feature-text); }
    .kind[data-kind="Fix"] { --kind-bg:var(--kind-fix-bg); --kind-border:var(--kind-fix-border); --kind-text:var(--kind-fix-text); }
    .title { flex:none; font-size:13px; font-weight:400; letter-spacing:-.1px; margin:0; overflow-wrap:anywhere; }
    .description { font-size:13px; color:var(--sub); overflow-wrap:anywhere; }
    .note { grid-row:2; min-width:0; min-height:0; max-height:100%; align-self:center; display:grid; grid-template-columns:20px minmax(0,1fr); column-gap:12px; row-gap:2px; text-align:start; }
    .note:has(.step-progress[hidden]) { grid-template-columns:minmax(0,1fr); column-gap:0; }
    .note .note-title { grid-column:2; grid-row:1; }
    .note .body { grid-column:2; grid-row:2; }
    .note:has(.step-progress[hidden]) .note-title, .note:has(.step-progress[hidden]) .body { grid-column:1; }
    .note[hidden] { display:none; }
    .heading { display:contents; }
    .pagination:has(.step-progress[hidden]) { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
    .pagination { grid-column:1; grid-row:1 / 3; align-self:center; display:inline-flex; align-items:center; gap:8px; color:var(--sub); font:12px/1.5 ui-monospace,monospace; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .step-progress { display:block; flex:none; width:20px; height:20px; transform:rotate(-90deg); }
    .step-progress circle { fill:none; stroke-width:3.5; }
    .progress-track { stroke:var(--progress-track); }
    .progress-fill { stroke:var(--color-bg-brand, #0d99ff); stroke-dasharray:100; stroke-dashoffset:100; transition-property:stroke-dashoffset; transition-timing-function:cubic-bezier(.4,0,.2,1); }
    @media (prefers-reduced-motion:reduce) { .progress-fill { transition-property:none; } }
    .step-progress[hidden] { display:none; }
    [data-step-count], [data-refresh] { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0; }
    .note-title { font-size:13px; font-weight:500; overflow-wrap:anywhere; }
    .body { min-width:0; font-size:13px; color:var(--sub); overflow-wrap:anywhere; }
    .accessibility { --history-fade-bg:var(--paper); grid-row:3; grid-column:1 / -1; min-height:0; align-self:stretch; display:flex; align-items:center; gap:12px; margin-inline:-24px; margin-block-end:-12px; padding:12px 24px; border-block-start:1px solid var(--line); border-radius:0 0 11px 11px; background:var(--history-fade-bg); pointer-events:none; }

    .a11y-badge { flex:none; align-self:center; --kind-bg:var(--kind-feature-bg); --kind-border:var(--kind-feature-border); --kind-text:var(--kind-feature-text); }
    .accessibility[hidden], .keystroke-overlay[hidden] { display:none; }
    .announcement-line { max-width:65%; flex:0 1 auto; display:flex; align-items:center; gap:8px; min-width:0; color:var(--sub); font-size:13px; line-height:20px; }
    .speaking-icon { width:18px; height:18px; flex:none; }
    .announcement { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .key-slot { flex:1; height:24px; min-width:0; padding-inline-start:12px; border-inline-start:1px solid var(--line); }
    .keystroke-overlay { position:relative; display:flex; align-items:center; gap:14px; width:100%; overflow:hidden; pointer-events:none; color:var(--ink); }
    .keystroke-overlay::after { content:""; position:absolute; inset-block:0; inset-inline-start:var(--history-fade-start,100%); width:var(--history-fade-width,0px); background:linear-gradient(to right,color-mix(in srgb,var(--history-fade-bg,var(--paper)) 18%,transparent),color-mix(in srgb,var(--history-fade-bg,var(--paper)) 78%,transparent)); pointer-events:none; }
    .keystroke { display:flex; flex:none; align-items:center; gap:6px; font:13px/1.5 ui-monospace,monospace; }
    .keystroke[data-key-history-entry] kbd { color:var(--sub); background:var(--paper); box-shadow:none; }
    .keystroke[data-keystroke] { font-weight:600; }
    .keystroke kbd { display:inline-block; padding:1px 7px; border:1px solid var(--keycap-border); border-radius:var(--radius-medium,5px); background:var(--keycap-bg); color:var(--keycap-text); font:inherit; white-space:nowrap; }
    .key-separator { font:inherit; }

  </style>
  <div class="stage ${theme}" data-canvas>
    <section class="footer" data-footer aria-label="Demo description">
      <div class="change"><div class="kind" data-kind></div><h2 class="title" data-title></h2><div class="description" data-description></div></div>
      <div class="note" data-note hidden aria-live="polite"><div class="heading"><span class="pagination" data-pagination><svg class="step-progress" data-step-progress aria-hidden="true" viewBox="0 0 20 20"><circle class="progress-track" cx="10" cy="10" r="8"/><circle class="progress-fill" data-progress-fill cx="10" cy="10" r="8" pathLength="100"/></svg><span data-step-count></span></span><span class="note-title" data-note-title></span></div><div class="body" data-note-body></div></div>
      ${accessibility ? `<div class="accessibility" data-accessibility aria-hidden="true"><div class="announcement-line"><span class="kind a11y-badge" data-a11y-badge>a11y</span>${hasAnnouncements ? '<svg class="speaking-icon" data-speaking-icon aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17v-3.5A5.5 5.5 0 1 1 12 8l1.5 2.5H12v2a1.5 1.5 0 0 1-1.5 1.5H8v3M15.5 8a3.5 3.5 0 0 1 0 5M17.5 5.5a7 7 0 0 1 0 10"/><circle cx="9.5" cy="7.5" r=".7" fill="currentColor" stroke="none"/></svg><span class="announcement" data-announcement>Waiting for an update…</span>' : ''}</div><div class="key-slot"><div class="keystroke-overlay" data-keystroke-overlay aria-hidden="true" hidden><span class="keystroke" data-keystroke></span></div></div></div>` : ''}
    </section>
    <div class="window" data-window>
      <div class="header"><div class="history" aria-label="Browser history"><button type="button" data-back aria-label="Back" title="Back" disabled><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 6 10l6 6M6 10h11"/></svg></button><button type="button" data-forward aria-label="Forward" title="Forward" disabled><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 4 6 6-6 6M14 10H3"/></svg></button><button type="button" class="refresh" data-refresh-button data-state="idle" aria-label="Refresh frame" title="Refresh frame"><svg data-refresh-icon aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 6a5.2 5.2 0 1 0 .1 4M13 2v4H9" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div><span data-refresh role="status" aria-live="polite" aria-atomic="true" hidden></span><div class="address" data-url role="textbox" aria-label="Application URL" aria-readonly="true">about:blank</div><span class="size" data-size></span></div>
      <div class="content" data-content><slot name="content"></slot></div>
    </div>

  </div>`
  const find = (selector) => shadow.querySelector(selector)
  find('[data-kind]').textContent = change.kind
  find('[data-kind]').dataset.kind = change.kind
  find('[data-title]').textContent = change.title
  find('[data-description]').textContent = change.description
  find('[data-back]').onclick = () => onNavigate?.(-1)
  find('[data-forward]').onclick = () => onNavigate?.(1)
  find('[data-refresh-button]').onclick = () => {
    if (find('[data-refresh-button]').dataset.state !== 'refreshing') {
      void Promise.resolve(onRefresh?.()).catch(() => {})
    }
  }
  const keyAnimations = new Set()
  const cancelKeyAnimations = () => {
    for (const animation of keyAnimations) animation.cancel()
    keyAnimations.clear()
  }
  let refreshTimer
  const finishRefreshSpin = () => {
    find('[data-refresh-button]').removeAttribute('data-spinning')
  }
  let currentViewport = viewport
  let isDestroyed = false

  const layout = () => {
    if (isDestroyed) return
    find('[data-canvas]').style.transform = `scale(${root.clientWidth / canvas.width})`
    const { width, height } = currentViewport
    const windowWidth = width + 22
    const windowHeight = height + 58
    const panelHeight = find('[data-footer]').offsetHeight
    const windowTop = 32 + panelHeight + 22
    const availableHeight = canvas.height - windowTop - 32
    const scale = Math.min(1, (canvas.width - 64) / windowWidth, availableHeight / windowHeight)
    if (scale <= 0) throw new Error('Presentation text leaves no room for the application')
    const windowY = windowTop + (availableHeight - windowHeight * scale) / 2
    Object.assign(find('[data-window]').style, {
      width: `${windowWidth}px`,
      left: `${(canvas.width - windowWidth * scale) / 2}px`,
      top: `${windowY}px`,
      transform: `scale(${scale})`,
    })
    Object.assign(find('[data-content]').style, { width: `${width}px`, height: `${height}px` })
    find('[data-size]').textContent = `${width} × ${height}`
  }
  layout()
  if (find('.change').scrollWidth > find('.change').clientWidth) {
    shadow.replaceChildren()
    throw new Error('Shorten the change title or description to fit the fixed footer')
  }
  let previousAnnotation = null
  const renderAnnotation = (annotation) => {
    find('[data-note]').hidden = annotation === null
    if (!annotation) return
    const progress = find('[data-step-progress]')
    progress.toggleAttribute('hidden', annotation.total <= 1)
    const fill = find('[data-progress-fill]')
    if (
      !previousAnnotation ||
      annotation.index !== previousAnnotation.index ||
      annotation.total !== previousAnnotation.total
    ) {
      const shouldAnimate =
        shouldAnimateAnnotations &&
        previousAnnotation &&
        annotation.total === previousAnnotation.total &&
        annotation.index > previousAnnotation.index
      fill.style.transitionDuration = shouldAnimate ? '650ms' : '0ms'
    }
    fill.style.strokeDashoffset = String(100 * (1 - annotation.index / annotation.total))
    find('[data-step-count]').textContent = `Step ${annotation.index} of ${annotation.total}`
    find('[data-note-title]').textContent = annotation.title
    find('[data-note-body]').textContent = annotation.body
  }
  let annotationAnimations = []
  const canAnimateAnnotationText = () =>
    shouldAnimateAnnotations && !matchMedia('(prefers-reduced-motion: reduce)').matches
  const cancelAnnotationAnimations = () => {
    for (const { animation, ghost } of annotationAnimations) {
      animation.cancel()
      ghost?.remove()
    }
    annotationAnimations = []
  }
  const captureAnnotationText = () => {
    if (!previousAnnotation || !canAnimateAnnotationText()) return []
    const panel = find('[data-footer]')
    const panelBox = panel.getBoundingClientRect()
    const scale = panelBox.width / panel.offsetWidth
    return ['[data-note-title]', '[data-note-body]'].map((selector) => {
      const element = find(selector)
      const box = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        text: element.textContent,
        style: {
          position: 'absolute',
          left: `${(box.left - panelBox.left) / scale - panel.clientLeft}px`,
          top: `${(box.top - panelBox.top) / scale - panel.clientTop}px`,
          width: `${box.width / scale}px`,
          font: style.font,
          letterSpacing: style.letterSpacing,
          color: style.color,
          overflowWrap: style.overflowWrap,
          pointerEvents: 'none',
        },
      }
    })
  }
  const animateAnnotationText = ({ previousText, hasAnnotation, shouldAnimate = true }) => {
    cancelAnnotationAnimations()
    if (!shouldAnimate || !canAnimateAnnotationText()) return
    for (const snapshot of previousText) {
      const ghost = document.createElement('div')
      ghost.setAttribute('data-annotation-ghost', '')
      ghost.setAttribute('aria-hidden', 'true')
      ghost.textContent = snapshot.text
      Object.assign(ghost.style, snapshot.style)
      find('[data-footer]').append(ghost)
      const animation = ghost.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 180,
        easing: 'ease-in-out',
      })
      animation.onfinish = () => ghost.remove()
      annotationAnimations.push({ animation, ghost })
    }
    if (hasAnnotation) {
      for (const selector of ['[data-note-title]', '[data-note-body]']) {
        const animation = find(selector).animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 180,
          easing: 'ease-in-out',
        })
        annotationAnimations.push({ animation })
      }
    }
  }
  const observer = new ResizeObserver(layout)
  observer.observe(root)
  observer.observe(find('[data-footer]'))
  layout()

  let activeAnimation
  const cancelAnimation = () => {
    if (!activeAnimation) return
    cancelAnimationFrame(activeAnimation.id)
    activeAnimation.resolve()
    activeAnimation = undefined
  }

  return {
    setTheme(value) {
      if (!['light', 'dark'].includes(value)) throw new Error('Theme must be light or dark')
      if (isDestroyed) return
      find('[data-canvas]').className = `stage ${value}`
    },
    setHistoryState({ canGoBack, canGoForward }) {
      if (isDestroyed) return
      find('[data-back]').disabled = !canGoBack || !onNavigate
      find('[data-forward]').disabled = !canGoForward || !onNavigate
    },
    setURL(value) {
      if (isDestroyed) return
      const url = new URL(value)
      url.username = ''
      url.password = ''
      const displayURL = ['http:', 'https:', 'about:'].includes(url.protocol)
        ? url.href
        : url.protocol
      find('[data-url]').textContent = displayURL
      find('[data-url]').title = displayURL
    },
    setAccessibilityState({ key, announcement, reset = false }) {
      if (!accessibility || isDestroyed) return
      if (reset) {
        cancelKeyAnimations()
        find('[data-keystroke-overlay]').hidden = true
        find('[data-keystroke-overlay]').innerHTML =
          '<span class="keystroke" data-keystroke></span>'
        if (hasAnnouncements) find('[data-announcement]').textContent = 'Waiting for an update…'
      }
      if (key) {
        const history = find('[data-keystroke-overlay]')
        const previousPositions = new Map(
          [...history.children]
            .filter((el) => el.textContent)
            .map((el) => [el, el.getBoundingClientRect().left]),
        )
        cancelKeyAnimations()
        for (const el of history.children) {
          if (!el.textContent) el.remove()
          else {
            el.removeAttribute('data-keystroke')
            el.setAttribute('data-key-history-entry', '')
          }
        }
        const chord = document.createElement('span')
        chord.className = 'keystroke'
        chord.setAttribute('data-keystroke', '')
        key.split(' + ').forEach((label, index) => {
          if (index > 0) {
            const separator = document.createElement('span')
            separator.className = 'key-separator'
            separator.setAttribute('data-key-separator', '')
            separator.textContent = ' + '
            chord.append(separator)
          }
          const keycap = document.createElement('kbd')
          keycap.textContent = label
          chord.append(keycap)
        })
        history.prepend(chord)
        while (history.children.length > 4) history.lastElementChild.remove()
        history.hidden = false
        const firstPrevious = history.children[1]
        const lastPrevious = history.lastElementChild
        history.style.setProperty('--history-fade-start', `${firstPrevious?.offsetLeft ?? 0}px`)
        history.style.setProperty(
          '--history-fade-width',
          `${firstPrevious ? lastPrevious.offsetLeft + lastPrevious.offsetWidth - firstPrevious.offsetLeft : 0}px`,
        )
        if (canAnimateAnnotationText() && history.offsetWidth > 0) {
          const scale = root.clientWidth / canvas.width
          for (const el of history.children) {
            const previousLeft = previousPositions.get(el)
            const offset =
              previousLeft === undefined
                ? -8
                : (previousLeft - el.getBoundingClientRect().left) / scale
            const animation = el.animate(
              [
                {
                  transform: `translateX(${offset}px)`,
                  opacity: previousLeft === undefined ? 0 : 1,
                },
                { transform: 'translateX(0)', opacity: 1 },
              ],
              { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' },
            )
            keyAnimations.add(animation)
            animation.onfinish = () => keyAnimations.delete(animation)
          }
        }
      }
      if (hasAnnouncements && announcement) find('[data-announcement]').textContent = announcement
    },
    animateViewport({ width, height, duration = 1000 }) {
      validateSize({ width, height, name: 'Viewport' })
      if (!Number.isFinite(duration) || duration < 0)
        throw new Error('Resize duration must be non-negative')
      cancelAnimation()
      const initial = currentViewport
      if (duration === 0 || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        currentViewport = { width, height }
        layout()
        return Promise.resolve()
      }
      return new Promise((resolve) => {
        const animation = { resolve, id: 0 }
        activeAnimation = animation
        const startedAt = performance.now()
        const tick = (now) => {
          if (activeAnimation !== animation) return
          const progress = Math.min(1, (now - startedAt) / duration)
          const eased = progress * progress * (3 - 2 * progress)
          currentViewport = {
            width: Math.round(initial.width + (width - initial.width) * eased),
            height: Math.round(initial.height + (height - initial.height) * eased),
          }
          layout()
          if (progress < 1) animation.id = requestAnimationFrame(tick)
          else {
            activeAnimation = undefined
            resolve()
          }
        }
        animation.id = requestAnimationFrame(tick)
      })
    },
    setViewport(value) {
      validateSize({ ...value, name: 'Viewport' })
      cancelAnimation()
      currentViewport = { width: value.width, height: value.height }
      layout()
    },
    setRefreshState({ state }) {
      if (!['idle', 'refreshing', 'refreshed', 'failed'].includes(state)) {
        throw new Error('Invalid refresh state')
      }
      clearTimeout(refreshTimer)
      if (isDestroyed) return
      const status = find('[data-refresh]')
      const button = find('[data-refresh-button]')
      const icon = find('[data-refresh-icon]')
      icon.removeEventListener('animationiteration', finishRefreshSpin)
      if (state === 'refreshing') {
        button.setAttribute('data-spinning', '')
      } else if (icon.getAnimations().length) {
        icon.addEventListener('animationiteration', finishRefreshSpin, { once: true })
      } else {
        finishRefreshSpin()
      }
      status.hidden = state === 'idle'
      button.dataset.state = state
      button.setAttribute('aria-disabled', String(state === 'refreshing'))
      status.textContent = {
        idle: '',
        refreshing: 'Refreshing…',
        refreshed: 'Refreshed',
        failed: 'Refresh failed',
      }[state]
      if (state === 'refreshed')
        refreshTimer = setTimeout(() => {
          status.hidden = true
          button.dataset.state = 'idle'
          status.textContent = ''
        }, 650)
    },
    setAnnotation(annotation) {
      if (annotation === null) {
        if (!previousAnnotation) return
        const previousText = captureAnnotationText()
        previousAnnotation = null
        renderAnnotation(null)
        animateAnnotationText({ previousText, hasAnnotation: false })
        return
      }
      const { index, total, title, body } = annotation
      if (
        !Number.isInteger(index) ||
        !Number.isInteger(total) ||
        index < 1 ||
        total < index ||
        !title?.trim() ||
        typeof body !== 'string'
      ) {
        throw new Error(
          'Annotation requires title, body, and integer pagination: 1 ≤ index ≤ total',
        )
      }
      if (
        previousAnnotation &&
        ['index', 'total', 'title', 'body'].every(
          (key) => previousAnnotation[key] === annotation[key],
        )
      )
        return
      const shouldAnimate = previousAnnotation !== null && index !== 1
      const previousText = captureAnnotationText()
      renderAnnotation(annotation)
      if (
        find('[data-note]').scrollHeight > find('[data-note]').clientHeight ||
        find('[data-note]').scrollWidth > find('[data-note]').clientWidth
      ) {
        renderAnnotation(previousAnnotation)
        throw new Error('Shorten the annotation to fit the fixed footer')
      }
      previousAnnotation = { index, total, title, body }
      animateAnnotationText({ previousText, hasAnnotation: true, shouldAnimate })
    },
    destroy() {
      cancelKeyAnimations()
      find('[data-refresh-icon]').removeEventListener('animationiteration', finishRefreshSpin)
      clearTimeout(refreshTimer)
      cancelAnnotationAnimations()
      cancelAnimation()
      isDestroyed = true
      observer.disconnect()
      shadow.replaceChildren()
    },
  }
}

function validateSize({ width, height, name }) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 7680 ||
    height > 4320
  ) {
    throw new Error(`${name} dimensions must be positive integers up to 7680×4320`)
  }
}

/** Reserve room for the initial viewport, window chrome, description, and outer margins. */
export function getDefaultCanvas({ viewport, accessibility = false }) {
  const panelHeight = accessibility ? 144 : 104
  return {
    width: Math.ceil(Math.max(1600, viewport.width + 22 + 64) / 2) * 2,
    height: Math.ceil(Math.max(1000, viewport.height + 58 + 32 + panelHeight + 22 + 32) / 2) * 2,
  }
}

/** Follows the iframe's own history without navigating the recording wrapper. */
export function bindDemoHistory({ app, chrome }) {
  let navigation
  const sync = () => {
    chrome.setURL(app.contentWindow.location.href)
    chrome.setHistoryState({
      canGoBack: navigation?.canGoBack ?? false,
      canGoForward: navigation?.canGoForward ?? false,
    })
  }
  const attach = () => {
    navigation?.removeEventListener('currententrychange', sync)
    // Opaque or external frames cannot expose their history to the recording wrapper.
    try {
      navigation = app.contentWindow.navigation
      sync()
    } catch {
      navigation = undefined
      chrome.setHistoryState({ canGoBack: false, canGoForward: false })
      return
    }
    navigation?.addEventListener('currententrychange', sync)
  }
  app.addEventListener('load', attach)
  return () => {
    app.removeEventListener('load', attach)
    navigation?.removeEventListener('currententrychange', sync)
  }
}
