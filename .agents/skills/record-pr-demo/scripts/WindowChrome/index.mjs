/** Shared presentation surface. Scenarios supply content, never presentation CSS. */
export function mountDemoChrome({
  root,
  viewport = { width: 1280, height: 720 },
  theme = 'light',
  onNavigate,
  onRefresh,
  shouldAnimateFeedback = true,
  accessibility = false,
  showAnnouncements = false,
  canvas = getDefaultCanvas({ viewport }),
}) {
  validateSize({ ...canvas, name: 'Canvas' })
  validateSize({ ...viewport, name: 'Viewport' })
  if (canvas.width < 800 || canvas.height < 600 || canvas.width % 2 || canvas.height % 2) {
    throw new Error('Canvas must be at least 800×600 with even dimensions')
  }
  if (!['light', 'dark'].includes(theme)) throw new Error('Theme must be light or dark')
  if (typeof accessibility !== 'boolean')
    throw new Error('Presentation accessibility must be a boolean')
  if (typeof showAnnouncements !== 'boolean')
    throw new Error('Presentation showAnnouncements must be a boolean')
  const hasAnnouncements = accessibility && showAnnouncements
  const shadow = root.attachShadow({ mode: 'open' })
  shadow.innerHTML = `<style>
    :host { --font-mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace; display:block; position:relative; width:100%; aspect-ratio:${canvas.width}/${canvas.height}; font:16px/1.5 system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
    * { box-sizing:border-box; }
    [hidden] { display:none; }
    .stage { position:absolute; inset:0 auto auto 0; width:${canvas.width}px; height:${canvas.height}px; transform-origin:top left; overflow:hidden; color:var(--ink); background:var(--stage); }
    .light { --paper:#fff; --ink:#252422; --sub:#66635e; --stage:var(--paper); --shell:#dddddd; --line:#c7c7c7; --rim:#ffffffa6; --badge:#ffffff70; }
    .dark { --paper:#191919; --ink:#ededeb; --sub:#ffffff; --stage:var(--paper); --shell:#232323; --line:var(--badge); --rim:#ffffff12; --badge:#2d2d2d; }
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
    .address { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; border:1px solid var(--line); border-radius:7px; padding:3px 9px; background:var(--badge); color:var(--sub); font:12px/1.5 var(--font-mono); }
    .history .refresh:hover, .history .refresh:focus-visible, .history .refresh[data-spinning] { opacity:1; }
    .refresh[data-spinning] svg { animation:refresh-spin 650ms linear infinite; }
    @keyframes refresh-spin { to { transform:rotate(360deg); } }
    @media (prefers-reduced-motion:reduce) { .refresh[data-spinning] svg { animation:none; } }
    .size { flex:none; padding:3px 9px; border:1px solid var(--line); border-radius:7px; background:var(--badge); color:var(--sub); font:12px/1.5 var(--font-mono); font-variant-numeric:tabular-nums; }
    .content { position:relative; overflow:hidden; border-radius:8px; background:var(--paper); }
    ::slotted([slot=content]) { display:block; width:100%; height:100%; border:0; }

    .kind { font-family:var(--font-mono); align-self:flex-start; padding-inline:6px; border:1px solid var(--kind-border); border-radius:4px; background:var(--kind-bg); color:var(--kind-text); font-size:12px; font-weight:500; line-height:16px; }
    .light { --kind-bug-bg:var(--color-bg-danger-tertiary,#ffe2e0); --kind-bug-border:var(--color-border-danger,#ffc7c2); --kind-bug-text:var(--color-text-danger,#dc3412); }
    .dark { --kind-bug-bg:var(--color-bg-danger-tertiary,#60332a); --kind-bug-border:var(--color-border-danger,#864537); --kind-bug-text:var(--color-text-danger,#ffafa3); }
    .kind[data-kind="Bug"] { --kind-bg:var(--kind-bug-bg); --kind-border:var(--kind-bug-border); --kind-text:var(--kind-bug-text); }
    [data-refresh] { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0; }
    .accessibility { flex:none; min-height:0; display:flex; flex-direction:column; align-items:stretch; gap:10px; margin:10px; padding:9px; border:1px solid var(--line); border-radius:8px; background:var(--paper); pointer-events:none; }
    .accessibility:not(:has([data-caption]:not([hidden]),[data-keystroke-overlay]:not([hidden]))) { display:none; }

    .accessibility[hidden], .announcement-line[hidden], .keystroke-overlay[hidden] { display:none; }
    .announcement-line { min-width:0; color:var(--ink); font-size:12px; line-height:18px; }
    .announcement { min-width:0; overflow:hidden; overflow-wrap:anywhere; white-space:normal; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; }
    .key-slot { min-width:0; }
    .keystroke-overlay { position:relative; display:flex; align-items:center; gap:6px; width:100%; min-height:22px; overflow:hidden; pointer-events:none; color:var(--ink); }
    .keystroke { display:flex; flex:none; align-items:center; gap:3px; font:11px/1.5 var(--font-mono); }
    .keystroke[data-key-history-entry]:nth-child(2) { opacity:.72; }
    .keystroke[data-key-history-entry]:nth-child(3) { opacity:.5; }
    .keystroke[data-key-history-entry]:nth-child(4) { opacity:.32; }
    .keystroke[data-key-history-entry] kbd { color:var(--sub); }
    .keystroke[data-keystroke] { font-weight:600; }
    .keystroke[data-keystroke] kbd { border-color:var(--ink); background:var(--ink); color:var(--paper); }
    .keystroke kbd { display:inline-flex; align-items:center; justify-content:center; min-height:22px; padding:1px 5px; border:1px solid var(--keycap-border); border-radius:var(--radius-medium,5px); background:var(--keycap-bg); color:var(--keycap-text); font:inherit; white-space:nowrap; }
    .key-separator { font:inherit; }

  </style>
  <div class="stage ${theme}" data-canvas>
    ${accessibility ? `<div class="accessibility" data-accessibility aria-hidden="true">${hasAnnouncements ? '<div class="announcement-line" data-caption hidden><span class="announcement" data-announcement>Waiting for an update…</span></div>' : ''}<div class="key-slot"><div class="keystroke-overlay" data-keystroke-overlay aria-hidden="true" hidden><span class="keystroke" data-keystroke></span></div></div></div>` : ''}
    <div class="window" data-window>
      <div class="header"><div class="history" aria-label="Browser history"><button type="button" data-back aria-label="Back" title="Back" disabled><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 6 10l6 6M6 10h11"/></svg></button><button type="button" data-forward aria-label="Forward" title="Forward" disabled><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 4 6 6-6 6M14 10H3"/></svg></button><button type="button" class="refresh" data-refresh-button data-state="idle" aria-label="Refresh frame" title="Refresh frame"><svg data-refresh-icon aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 6a5.2 5.2 0 1 0 .1 4M13 2v4H9" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div><span data-refresh role="status" aria-live="polite" aria-atomic="true" hidden></span><div class="address" data-url role="textbox" aria-label="Application URL" aria-readonly="true">about:blank</div><span class="size" data-size></span></div>
      <div class="content" data-content><slot name="content"></slot></div>
    </div>

  </div>`
  const find = (selector) => shadow.querySelector(selector)
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
    const scale = Math.min(
      1,
      (canvas.width - 332) / windowWidth,
      (canvas.height - 64) / windowHeight,
    )
    const windowY = (canvas.height - windowHeight * scale) / 2
    Object.assign(find('[data-window]').style, {
      width: `${windowWidth}px`,
      left: '316px',
      top: `${windowY}px`,
      transform: `scale(${scale})`,
    })
    Object.assign(find('[data-content]').style, { width: `${width}px`, height: `${height}px` })
    find('[data-size]').textContent = `${width} × ${height}`
  }
  layout()
  const canAnimateFeedback = () =>
    shouldAnimateFeedback && !matchMedia('(prefers-reduced-motion: reduce)').matches
  const observer = new ResizeObserver(layout)
  observer.observe(root)

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
        if (hasAnnouncements) {
          find('[data-announcement]').textContent = 'Waiting for an update…'
          find('[data-caption]').hidden = true
        }
      }
      if (key) {
        const history = find('[data-keystroke-overlay]')
        const previousPositions = new Map(
          [...history.children]
            .filter((el) => el.textContent)
            .map((el) => [
              el,
              {
                left: el.getBoundingClientRect().left,
                opacity: Number(getComputedStyle(el).opacity),
              },
            ]),
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
        while (history.children.length > 1 && history.scrollWidth > history.clientWidth) {
          history.lastElementChild.remove()
        }
        if (canAnimateFeedback() && history.offsetWidth > 0) {
          const scale = root.clientWidth / canvas.width
          for (const el of history.children) {
            const previous = previousPositions.get(el)
            const opacity = Number(getComputedStyle(el).opacity)
            const offset =
              previous === undefined
                ? -8
                : (previous.left - el.getBoundingClientRect().left) / scale
            const animation = el.animate(
              [
                {
                  transform: `translateX(${offset}px)`,
                  opacity: previous?.opacity ?? 0,
                },
                { transform: 'translateX(0)', opacity },
              ],
              { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' },
            )
            keyAnimations.add(animation)
            animation.onfinish = () => keyAnimations.delete(animation)
          }
        }
      }
      if (hasAnnouncements && announcement) {
        find('[data-announcement]').textContent = announcement
        find('[data-caption]').hidden = false
      }
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
    destroy() {
      cancelKeyAnimations()
      find('[data-refresh-icon]').removeEventListener('animationiteration', finishRefreshSpin)
      clearTimeout(refreshTimer)
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

/** Reserve room for the initial viewport, sidebar, browser chrome, and margins. */
export function getDefaultCanvas({ viewport }) {
  return {
    width: Math.ceil((viewport.width + 22 + 332) / 2) * 2,
    height: Math.ceil(Math.max(1000, viewport.height + 58 + 128) / 2) * 2,
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
