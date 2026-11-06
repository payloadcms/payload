/** Shared description-only sidebar for the playground and recordings. */
export function mountAnnotationSidebar({ root, steps, onSelect, shouldAnimate = true }) {
  if (
    !Array.isArray(steps) ||
    !steps.length ||
    steps.some(
      (step) =>
        !step ||
        typeof step.body !== 'string' ||
        !step.body.trim() ||
        (step.kind !== undefined && step.kind !== 'Bug'),
    )
  ) {
    throw new Error(
      'Sidebar requires nonempty annotationSteps with body text and optional kind: Bug',
    )
  }
  const shadow = root.shadowRoot
  const style = document.createElement('style')
  style.textContent = `
    .stage[data-sidebar] .footer { display:none; }
    .annotation-sidebar { position:absolute; left:16px; width:300px; border:1px solid var(--line); border-radius:18px; background:var(--paper); color:var(--ink); overflow:hidden; display:flex; flex-direction:column; }
    .annotation-sidebar[hidden], .sidebar-steps[hidden] { display:none; }
    .sidebar-intro { flex:none; padding:20px 24px; background:color-mix(in srgb,var(--ink) 5%,var(--paper)); }
    .sidebar-intro .kind { display:inline-block; }
    .sidebar-intro p { margin:6px 0 0; color:#fff; font-size:14px; line-height:1.6; }
    .sidebar-steps { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-color:var(--sub) transparent; list-style:none; margin:0; padding:4px 12px 12px; }
    .sidebar-step { width:100%; position:relative; display:block; border:0; border-radius:8px; padding:18px 12px; background:transparent; color:var(--ink); text-align:left; opacity:.42; transition:opacity 200ms ease; }
    button.sidebar-step { cursor:pointer; }
    button.sidebar-step:hover { opacity:.75; }
    .sidebar-step:focus-visible { outline:2px solid #0d99ff; outline-offset:-2px; }
    .sidebar-step[aria-current=step] { opacity:1; }
    .sidebar-dot { position:absolute; left:-3.5px; top:26px; width:7px; height:7px; border-radius:50%; background:transparent; }
    [aria-current=step] .sidebar-dot { background:#0d99ff; }
    .sidebar-steps li + li::before { content:""; display:block; width:calc(100% + 24px); height:1px; margin:0 -12px; background:var(--line); }
    .sidebar-step .kind { display:inline-block; margin-bottom:6px; }
    .sidebar-step p { margin:0; font-size:14px; line-height:1.6; color:var(--sub); }
    @media(prefers-reduced-motion:reduce) { .sidebar-step { transition:none; } }
  `
  shadow.append(style)
  const panel = document.createElement('section')
  panel.className = 'annotation-sidebar dark'
  panel.setAttribute('aria-label', 'Walkthrough steps')
  const intro = document.createElement('div')
  intro.className = 'sidebar-intro'
  const badge = shadow.querySelector('[data-kind]').cloneNode(true)
  const description = document.createElement('p')
  description.textContent = shadow.querySelector('[data-description]').textContent
  intro.append(badge, description)
  const list = document.createElement('ol')
  list.className = 'sidebar-steps'
  list.tabIndex = 0
  list.setAttribute('aria-label', 'Scrollable walkthrough steps')
  const buttons = steps.map((step, index) => {
    const item = document.createElement('li')
    const button = document.createElement(onSelect ? 'button' : 'div')
    if (onSelect) button.type = 'button'
    button.className = 'sidebar-step'
    const dot = document.createElement('span')
    dot.className = 'sidebar-dot'
    dot.setAttribute('aria-hidden', 'true')
    const text = document.createElement('div')
    if (step.kind === 'Bug') {
      const pill = document.createElement('span')
      pill.className = 'kind'
      pill.dataset.kind = 'Bug'
      pill.textContent = 'Bug'
      text.append(pill)
    }
    const body = document.createElement('p')
    body.textContent = step.body
    text.append(body)
    button.append(dot, text)
    if (onSelect) button.addEventListener('click', () => onSelect(index))
    item.append(button)
    list.append(item)
    return button
  })
  panel.append(intro, list)
  const stage = shadow.querySelector('[data-canvas]')
  stage.append(panel)
  let viewport
  let sidebarGeometry
  let currentIndex
  let scrollFrame
  const revealCurrentStep = () => {
    const button = buttons[currentIndex]
    if (!button || panel.hidden || !list.clientHeight) return
    const bounds = list.getBoundingClientRect()
    const step = button.getBoundingClientRect()
    const scale = list.clientHeight / bounds.height
    const top = (step.top - bounds.top) * scale + list.scrollTop
    const bottom = (step.bottom - bounds.top) * scale + list.scrollTop
    const padding = 24
    let target = list.scrollTop
    if (top < target + padding || bottom - top > list.clientHeight - padding * 2) {
      target = top - padding
    } else if (bottom > target + list.clientHeight - padding) {
      target = bottom - list.clientHeight + padding
    }
    if (Math.abs(target - list.scrollTop) > 1) {
      list.scrollTo({
        top: Math.max(0, target),
        behavior:
          shouldAnimate && !matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'smooth'
            : 'instant',
      })
    }
  }
  const layout = () => {
    if (!viewport) return
    const { enabled } = viewport
    const content = shadow.querySelector('[data-content]')
    const width = parseFloat(content.style.width)
    const height = parseFloat(content.style.height)
    if (!enabled) return
    const windowWidth = width + 22
    const windowHeight = height + 58
    const left = 332
    const availableWidth = stage.clientWidth - 348
    const scale = Math.min(
      1,
      availableWidth / windowWidth,
      (stage.clientHeight - 64) / windowHeight,
    )
    const top = (stage.clientHeight - windowHeight * scale) / 2
    sidebarGeometry ??= {
      top: `${top - 32}px`,
      height: `${windowHeight * scale + 64}px`,
    }
    Object.assign(panel.style, sidebarGeometry)
    Object.assign(shadow.querySelector('[data-window]').style, {
      left: `${left + (availableWidth - windowWidth * scale) / 2}px`,
      top: `${top}px`,
      transform: `scale(${scale})`,
    })
  }
  // The shared chrome lays out again after the host resizes, including initial load.
  // Reapply the sidebar placement after its observer has run.
  const observer = new ResizeObserver(layout)
  observer.observe(root)
  observer.observe(shadow.querySelector('[data-footer]'))
  const contentObserver = new MutationObserver(layout)
  contentObserver.observe(shadow.querySelector('[data-content]'), {
    attributes: true,
    attributeFilter: ['style'],
  })
  return {
    destroy: () => {
      observer.disconnect()
      contentObserver.disconnect()
      cancelAnimationFrame(scrollFrame)
    },
    update({ index, width, height, enabled, visible }) {
      if (!Number.isInteger(index) || index < 0 || index >= steps.length) {
        throw new Error('Sidebar step index is outside annotationSteps')
      }
      const shouldReveal =
        index !== currentIndex || ((panel.hidden || list.hidden) && enabled && visible)
      currentIndex = index
      stage.toggleAttribute('data-sidebar', enabled)
      panel.hidden = !enabled
      list.hidden = !visible
      buttons.forEach((button, i) => {
        if (i === index) button.setAttribute('aria-current', 'step')
        else button.removeAttribute('aria-current')
      })
      viewport = { width, height, enabled }
      layout()
      if (shouldReveal && enabled && visible) {
        cancelAnimationFrame(scrollFrame)
        scrollFrame = requestAnimationFrame(revealCurrentStep)
      }
    },
  }
}
