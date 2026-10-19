/** Shared presentation surface. Scenarios supply content, never presentation CSS. */
export function mountDemoChrome({
  root,
  change,
  canvas = { width: 1600, height: 1000 },
  viewport = { width: 1280, height: 720 },
  theme = 'light',
  showSize = true,
  shouldAnimateAnnotations = true,
  accessibility = false,
  showAnnouncements = false,
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
    .header { height:36px; display:flex; align-items:center; justify-content:space-between; padding:0 12px 8px; gap:18px; }
    .dots { display:flex; gap:8px; }
    .dots span { width:10px; height:10px; border-radius:100%; background:var(--sub); opacity:.6; }
    .header-info { display:flex; align-items:center; justify-content:flex-end; gap:12px; min-width:0; }
    .refresh { display:flex; align-items:center; gap:0; color:var(--sub); font:12px/1.5 system-ui,sans-serif; white-space:nowrap; }
    .refresh[hidden] { display:none; }
    .refresh svg { width:14px; height:14px; flex:none; }
    .refresh[data-state=refreshing] svg { animation:refresh-spin 650ms linear infinite; }
    @keyframes refresh-spin { to { transform:rotate(360deg); } }
    @media (prefers-reduced-motion:reduce) { .refresh[data-state=refreshing] svg { animation:none; } }
    .size { padding:5px 9px; border-radius:8px; background:var(--badge); color:var(--sub); font:12px/1.5 ui-monospace,monospace; font-variant-numeric:tabular-nums; }
    .content { position:relative; overflow:hidden; border-radius:8px; background:var(--paper); }
    ::slotted([slot=content]) { display:block; width:100%; height:100%; border:0; }
    .footer { position:absolute; top:32px; left:50%; transform:translateX(-50%); width:min(1302px,calc(100% - 64px)); height:112px; display:grid; grid-template-rows:minmax(0,1fr); grid-template-columns:minmax(0,420fr) minmax(0,826fr); align-items:center; padding:12px 24px; border-radius:12px; color:var(--ink); background:var(--paper); }
    .change { min-height:0; align-self:stretch; display:flex; flex-direction:column; justify-content:center; gap:2px; padding-inline-end:28px; border-inline-end:1px solid var(--line); }
    .kind { align-self:flex-start; padding-inline:6px; border:1px solid var(--kind-border); border-radius:4px; background:var(--kind-bg); color:var(--kind-text); font-size:12px; font-weight:500; line-height:16px; }
    .kind[data-kind="Feature"] { --kind-bg:var(--kind-feature-bg); --kind-border:var(--kind-feature-border); --kind-text:var(--kind-feature-text); }
    .kind[data-kind="Fix"] { --kind-bg:var(--kind-fix-bg); --kind-border:var(--kind-fix-border); --kind-text:var(--kind-fix-text); }
    .title { font-size:18px; font-weight:400; letter-spacing:-.1px; margin:0; overflow-wrap:anywhere; }
    .description { font-size:13px; color:var(--sub); overflow-wrap:anywhere; }
    .note { padding-inline-start:28px; min-width:0; }
    .heading { display:flex; align-items:center; gap:12px; margin-block-end:4px; }
    .pagination { display:inline-flex; align-items:center; gap:8px; color:var(--sub); font:12px/1.5 ui-monospace,monospace; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .step-progress { display:block; flex:none; width:20px; height:20px; transform:rotate(-90deg); }
    .step-progress circle { fill:none; stroke-width:3.5; }
    .progress-track { stroke:var(--progress-track); }
    .progress-fill { stroke:var(--color-bg-brand, #0d99ff); stroke-dasharray:100; stroke-dashoffset:100; transition-property:stroke-dashoffset; transition-timing-function:cubic-bezier(.4,0,.2,1); }
    @media (prefers-reduced-motion:reduce) { .progress-fill { transition-property:none; } }
    .step-progress[hidden] { display:none; }
    [data-step-count], [data-refresh-text] { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0; }
    .note-title { font-size:16px; font-weight:500; overflow-wrap:anywhere; }
    .body { font-size:16px; color:var(--sub); overflow-wrap:anywhere; }
    .accessibility { position:absolute; inset:auto 0 32px; margin-inline:auto; width:min(1302px,calc(100% - 64px)); height:88px; padding:12px 20px; border-radius:12px; background:var(--paper); pointer-events:none; }
    .accessibility[hidden], .focus-highlight[hidden], .keystroke-overlay[hidden] { display:none; }
    .accessibility-label { color:var(--sub); font-size:11px; letter-spacing:.3px; margin-block-end:4px; }
    .keystroke-overlay { position:absolute; inset:auto auto 24px 24px; z-index:3; pointer-events:none; max-width:calc(100% - 48px); color:var(--ink); }
    .keystroke { display:flex; align-items:center; flex-wrap:wrap; gap:8px; font:16px/1.5 ui-monospace,monospace; }
    .keystroke kbd { display:inline-block; padding:6px 10px; border:1px solid var(--keycap-border); border-radius:var(--radius-medium,5px); background:var(--keycap-bg); color:var(--keycap-text); box-shadow:var(--elevation-300-tooltip,0 3px 8px #00000024); font:inherit; white-space:nowrap; }
    .key-separator { font:inherit; text-shadow:0 0 3px var(--paper); }
    .announcement { font-size:16px; line-height:22px; max-height:44px; overflow:hidden; overflow-wrap:anywhere; }
    .focus-highlight { position:absolute; z-index:2; pointer-events:none; border:3px solid var(--color-bg-brand,#007be5); box-shadow:0 0 0 2px white, inset 0 0 0 1px white; border-radius:4px; }
  </style>
  <div class="stage ${theme}" data-canvas>
    <section class="footer" data-footer aria-label="Demo description">
      <div class="change"><div class="kind" data-kind></div><h2 class="title" data-title></h2><div class="description" data-description></div></div>
      <div class="note" data-note hidden aria-live="polite"><div class="heading"><span class="pagination" data-pagination><svg class="step-progress" data-step-progress aria-hidden="true" viewBox="0 0 20 20"><circle class="progress-track" cx="10" cy="10" r="8"/><circle class="progress-fill" data-progress-fill cx="10" cy="10" r="8" pathLength="100"/></svg><span data-step-count></span></span><span class="note-title" data-note-title></span></div><div class="body" data-note-body></div></div>
    </section>
    <div class="window" data-window>
      <div class="header"><div class="dots" aria-hidden="true"><span></span><span></span><span></span></div><div class="header-info" data-header-info><span class="refresh" data-refresh role="status" aria-live="polite" aria-atomic="true" hidden><svg data-refresh-icon aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path data-refresh-path d="M13 6a5.2 5.2 0 1 0 .1 4M13 2v4H9" stroke-linecap="round" stroke-linejoin="round"/></svg><span data-refresh-text></span></span><span class="size" data-size></span></div></div>
      <div class="content" data-content><slot name="content"></slot>${accessibility ? '<div class="focus-highlight" data-focus-highlight aria-hidden="true" hidden></div><div class="keystroke-overlay" data-keystroke-overlay aria-hidden="true" hidden><span class="keystroke" data-keystroke></span></div>' : ''}</div>
    </div>
    ${hasAnnouncements ? '<div class="accessibility" data-accessibility aria-hidden="true"><div class="accessibility-label">LIVE REGION · OBSERVED TEXT, NOT SCREEN-READER AUDIO</div><div class="announcement" data-announcement>Waiting for an update…</div></div>' : ''}
  </div>`
  const find = (selector) => shadow.querySelector(selector)
  find('[data-kind]').textContent = change.kind
  find('[data-kind]').dataset.kind = change.kind
  find('[data-title]').textContent = change.title
  find('[data-description]').textContent = change.description
  find('[data-size]').hidden = !showSize
  let keyTimer
  let focusRect
  let refreshTimer
  let currentViewport = viewport
  let isDestroyed = false

  const positionKeystroke = () => {
    const overlay = find('[data-keystroke-overlay]')
    if (!overlay || overlay.hidden) return
    const content = find('[data-content]')
    Object.assign(overlay.style, { inset: 'auto', left: '24px', top: '24px' })
    const center = (content.clientWidth - overlay.offsetWidth) / 2
    const bottom = content.clientHeight - overlay.offsetHeight - 24
    const positions = [
      { x: center, y: bottom },
      { x: center, y: 24 },
    ]
    const point =
      positions.find(
        ({ x, y }) =>
          !focusRect ||
          x + overlay.offsetWidth + 8 <= focusRect.x ||
          x >= focusRect.x + focusRect.width + 8 ||
          y + overlay.offsetHeight + 8 <= focusRect.y ||
          y >= focusRect.y + focusRect.height + 8,
      ) ?? positions[0]
    Object.assign(overlay.style, { inset: 'auto', left: `${point.x}px`, top: `${point.y}px` })
  }

  const layout = () => {
    if (isDestroyed) return
    find('[data-canvas]').style.transform = `scale(${root.clientWidth / canvas.width})`
    const { width, height } = currentViewport
    const windowWidth = width + 22
    const windowHeight = height + 58
    const panelHeight = find('[data-footer]').offsetHeight
    const windowTop = 32 + panelHeight + 22
    const availableHeight = canvas.height - windowTop - 32 - (hasAnnouncements ? 110 : 0)
    const scale = Math.min(1, (canvas.width - 64) / windowWidth, availableHeight / windowHeight)
    if (scale <= 0) throw new Error('Presentation text leaves no room for the application')
    Object.assign(find('[data-window]').style, {
      width: `${windowWidth}px`,
      left: `${(canvas.width - windowWidth * scale) / 2}px`,
      top: `${windowTop + (availableHeight - windowHeight * scale) / 2}px`,
      transform: `scale(${scale})`,
    })
    Object.assign(find('[data-content]').style, { width: `${width}px`, height: `${height}px` })
    find('[data-size]').textContent = `${width} × ${height}`
    positionKeystroke()
  }
  layout()
  if (find('.change').scrollHeight > find('.change').clientHeight) {
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
          left: `${(box.left - panelBox.left) / scale}px`,
          top: `${(box.top - panelBox.top) / scale}px`,
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
    setAccessibilityState({ key, focus, announcement, reset = false }) {
      if (!accessibility || isDestroyed) return
      if (reset) {
        clearTimeout(keyTimer)
        find('[data-keystroke-overlay]').hidden = true
        find('[data-keystroke]').textContent = ''
        if (hasAnnouncements) find('[data-announcement]').textContent = 'Waiting for an update…'
        find('[data-focus-highlight]').hidden = true
      }
      if (key) {
        clearTimeout(keyTimer)
        const chord = find('[data-keystroke]')
        chord.replaceChildren()
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
        find('[data-keystroke-overlay]').hidden = false
        keyTimer = setTimeout(() => {
          find('[data-keystroke-overlay]').hidden = true
        }, 2000)
      }
      if (focus !== undefined) {
        focusRect = focus
        const highlight = find('[data-focus-highlight]')
        highlight.hidden = !focusRect
        if (focusRect)
          Object.assign(highlight.style, {
            left: `${focusRect.x}px`,
            top: `${focusRect.y}px`,
            width: `${focusRect.width}px`,
            height: `${focusRect.height}px`,
          })
      }
      positionKeystroke()
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
      status.hidden = state === 'idle'
      status.dataset.state = state
      find('[data-refresh-path]').setAttribute(
        'd',
        {
          idle: '',
          refreshing: 'M13 6a5.2 5.2 0 1 0 .1 4M13 2v4H9',
          refreshed: 'M3 8l3.2 3.2L13 4.5',
          failed: 'M4 4l8 8M12 4l-8 8',
        }[state],
      )
      find('[data-refresh-text]').textContent = {
        idle: '',
        refreshing: 'Refreshing…',
        refreshed: 'Refreshed',
        failed: 'Refresh failed',
      }[state]
      if (state === 'refreshed')
        refreshTimer = setTimeout(() => {
          status.hidden = true
          find('[data-refresh-text]').textContent = ''
        }, 650)
    },
    setSizeVisible({ isVisible }) {
      find('[data-size]').hidden = !isVisible
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
      if (find('[data-note]').offsetHeight > find('[data-footer]').clientHeight - 24) {
        renderAnnotation(previousAnnotation)
        throw new Error('Shorten the annotation to fit the fixed footer')
      }
      previousAnnotation = { index, total, title, body }
      animateAnnotationText({ previousText, hasAnnotation: true, shouldAnimate })
    },
    destroy() {
      clearTimeout(keyTimer)
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
