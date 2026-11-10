/** Shared walkthrough sidebar for the playground and recordings. */
export function mountAnnotationSidebar({ root, change, steps, onSelect, shouldAnimate = true }) {
  if (
    !change ||
    !['Feature', 'Fix', 'Bug'].includes(change.kind) ||
    !change.title?.trim() ||
    !change.description?.trim()
  ) {
    throw new Error('Presentation requires kind (Feature, Fix, or Bug), title, and description')
  }
  const hasDeclaredSteps = steps !== undefined
  if (
    hasDeclaredSteps &&
    (!Array.isArray(steps) ||
      !steps.length ||
      steps.some(
        (step) =>
          !step ||
          typeof step.body !== 'string' ||
          !step.body.trim() ||
          (step.kind !== undefined && step.kind !== 'Bug'),
      ))
  ) {
    throw new Error(
      'Sidebar requires nonempty annotationSteps with body text and optional kind: Bug',
    )
  }
  steps = steps ?? [{ body: '' }]
  const shadow = root.shadowRoot
  const style = document.createElement('style')
  // Extend the shell 1px beneath the window to prevent seams at fractional preview scales.
  style.textContent = `
    .window { border:0; padding-bottom:12px; border-top-left-radius:0; border-bottom-left-radius:0; }
    .sidebar-shell { position:absolute; left:16px; width:301px; border-radius:18px 0 0 18px; background:var(--sidebar-bg,var(--shell)); overflow:hidden; }
    .annotation-sidebar { width:300px; height:100%; color:var(--ink); overflow:hidden; display:flex; flex-direction:column; }
    .sidebar-feedback { flex:none; display:flex; flex-direction:column; }
    .sidebar-feedback:not(:has([data-caption]:not([hidden]),[data-keystroke-overlay]:not([hidden]))) { display:none; }
    .sidebar-feedback .accessibility { margin-block-start:0; }
    .sidebar-feedback > .sidebar-heading { margin-block-start:8px; }
    .annotation-sidebar:has([data-caption]:not([hidden]),[data-keystroke-overlay]:not([hidden])) .sidebar-steps { padding-block-end:0; }
    .sidebar-overview-row { flex:none; height:36px; display:flex; align-items:center; padding-bottom:8px; margin:10px 10px 0; }
    .sidebar-overview-row .sidebar-heading { flex:1; margin:0; }
    .sidebar-heading { flex:none; margin:10px 10px 8px; padding:3px 9px; border:1px solid var(--line); border-radius:7px; background:var(--badge); color:var(--sub); font:12px/1.5 var(--font-mono); }
    .sidebar-intro { flex:none; display:flex; align-items:flex-start; gap:10px; margin:0 10px 8px; padding:12px 14px; border:1px solid var(--line); border-radius:8px; background:var(--paper); }
    .sidebar-intro + .sidebar-heading { margin-top:0; }
    .sidebar-intro p { margin:0; min-width:0; color:var(--ink); font-size:12px; line-height:1.4; }
    .sidebar-steps-viewport { position:relative; flex:1; min-height:0; }
    .sidebar-steps-viewport::before, .sidebar-steps-viewport::after { content:""; position:absolute; inset-inline:-1px; height:12px; z-index:1; pointer-events:none; mask-image:linear-gradient(to right,transparent,#000 18px,#000 calc(100% - 18px),transparent); opacity:0; transition:${shouldAnimate ? 'opacity 160ms ease' : 'none'}; }
    .sidebar-steps-viewport::before { inset-block-start:-1px; background:linear-gradient(to bottom,var(--scroll-edge-shadow, rgb(0 0 0 / .14)),transparent); }
    .sidebar-steps-viewport::after { inset-block-end:-1px; background:linear-gradient(to top,var(--scroll-edge-shadow, rgb(0 0 0 / .14)),transparent); }
    .sidebar-steps-viewport[data-overflow-above]::before, .sidebar-steps-viewport[data-overflow-below]::after { opacity:1; }
    .dark .sidebar-steps-viewport { --scroll-edge-shadow:rgb(0 0 0 / .4); }
    .sidebar-steps { height:100%; min-height:0; overflow-y:auto; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-color:var(--sub) transparent; list-style:none; margin:0; padding:0 10px 10px; }
    .sidebar-step { width:100%; position:relative; display:block; border:1px solid var(--line); border-radius:8px; padding:0; overflow:hidden; background:var(--paper); color:var(--ink); text-align:left; }
    button.sidebar-step { cursor:pointer; }
    .sidebar-step :is(p,.sidebar-step-title) { opacity:.5; transition:opacity 200ms ease; }
    button.sidebar-step:hover :is(p,.sidebar-step-title) { opacity:.85; }
    .sidebar-step:focus-visible { outline:2px solid #0d99ff; outline-offset:-2px; }
    .sidebar-step[aria-current=step] :is(p,.sidebar-step-title) { opacity:1; }
    .sidebar-dot { position:absolute; z-index:1; pointer-events:none; right:8px; top:8px; width:8px; height:8px; border-radius:50%; background:transparent; }
    [aria-current=step] .sidebar-dot { background:#0d99ff; }
    .sidebar-steps li + li { margin-top:6px; }
    .sidebar-step-title { display:flex; align-items:center; margin:0; padding:10px 24px 0px 14px; border:0; border-radius:0; background:var(--paper); color:var(--sub); font:12px/1.5 var(--font-mono); }
    .sidebar-step p { margin:0; padding:12px 14px; font-size:12px; line-height:1.4; color:var(--ink); }
    .sidebar-step-title + p { padding-top:10px; }
    @media(prefers-reduced-motion:reduce) { .sidebar-step :is(p,.sidebar-step-title), .sidebar-steps-viewport::before, .sidebar-steps-viewport::after { transition:none; } }
  `
  shadow.append(style)
  const shell = document.createElement('div')
  shell.className = 'sidebar-shell'
  const panel = document.createElement('section')
  panel.className = 'annotation-sidebar'
  panel.setAttribute('aria-label', 'Walkthrough steps')
  const heading = document.createElement('div')
  heading.className = 'sidebar-heading'
  heading.textContent = `Overview · ${change.kind}`
  heading.title = change.title
  const overviewRow = document.createElement('div')
  overviewRow.className = 'sidebar-overview-row'
  overviewRow.append(heading)
  const walkthroughHeading = document.createElement('div')
  walkthroughHeading.className = 'sidebar-heading'
  walkthroughHeading.textContent = 'Walkthrough'
  const intro = document.createElement('div')
  intro.className = 'sidebar-intro'
  const description = document.createElement('p')
  description.textContent = change.description
  intro.append(description)
  const listViewport = document.createElement('div')
  listViewport.className = 'sidebar-steps-viewport'
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
      const title = document.createElement('div')
      title.className = 'sidebar-step-title'
      const pill = document.createElement('span')
      pill.className = 'kind'
      pill.dataset.kind = 'Bug'
      pill.textContent = 'Bug'
      title.append(pill)
      text.append(title)
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
  listViewport.append(list)
  panel.append(overviewRow, intro, walkthroughHeading, listViewport)
  const feedback = shadow.querySelector('[data-accessibility]')
  if (feedback) {
    const feedbackSection = document.createElement('div')
    feedbackSection.className = 'sidebar-feedback'
    feedbackSection.setAttribute('aria-hidden', 'true')
    const feedbackHeading = document.createElement('div')
    feedbackHeading.className = 'sidebar-heading'
    feedbackHeading.textContent = feedback.querySelector('[data-caption]')
      ? 'Keyboard & updates'
      : 'Keyboard'
    feedbackSection.append(feedbackHeading, feedback)
    panel.append(feedbackSection)
  }
  const stage = shadow.querySelector('[data-canvas]')
  shell.append(panel)
  stage.append(shell)
  let currentIndex
  let scrollFrame
  const updateScrollIndicators = () => {
    const hasOverflow = list.clientHeight > 0 && list.scrollHeight - list.clientHeight > 1
    listViewport.toggleAttribute('data-overflow-above', hasOverflow && list.scrollTop > 1)
    listViewport.toggleAttribute(
      'data-overflow-below',
      hasOverflow && list.scrollTop + list.clientHeight < list.scrollHeight - 1,
    )
  }
  list.addEventListener('scroll', updateScrollIndicators, { passive: true })
  const revealCurrentStep = () => {
    const button = buttons[currentIndex]
    if (!button || !list.clientHeight) return
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
    const window = shadow.querySelector('[data-window]')
    const scale = new DOMMatrixReadOnly(window.style.transform).a
    const top = window.style.top
    const height = `${window.offsetHeight * scale}px`
    const hasChanged = shell.style.top !== top || shell.style.height !== height
    Object.assign(shell.style, { top, height })
    if (hasChanged) {
      cancelAnimationFrame(scrollFrame)
      scrollFrame = requestAnimationFrame(revealCurrentStep)
    }
  }
  // WindowChrome owns placement; the sidebar only follows its rendered geometry.
  const observer = new MutationObserver(layout)
  observer.observe(shadow.querySelector('[data-window]'), {
    attributes: true,
    attributeFilter: ['style'],
  })
  const listObserver = new ResizeObserver(() => {
    updateScrollIndicators()
    cancelAnimationFrame(scrollFrame)
    scrollFrame = requestAnimationFrame(revealCurrentStep)
  })
  listObserver.observe(list)
  const sidebar = {
    setAnnotation(annotation) {
      if (annotation === null) {
        sidebar.update({ index: currentIndex ?? 0, visible: false })
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
      if (hasDeclaredSteps && (total !== steps.length || body !== steps[index - 1]?.body)) {
        throw new Error('Annotation must match its declared annotationSteps entry and total')
      }
      const shouldReveal = !hasDeclaredSteps && buttons[0].querySelector('p').textContent !== body
      if (!hasDeclaredSteps) buttons[0].querySelector('p').textContent = body
      sidebar.update({ index: hasDeclaredSteps ? index - 1 : 0, visible: true, shouldReveal })
    },
    destroy: () => {
      observer.disconnect()
      listObserver.disconnect()
      list.removeEventListener('scroll', updateScrollIndicators)
      cancelAnimationFrame(scrollFrame)
    },
    update({ index, visible, shouldReveal = false }) {
      if (!Number.isInteger(index) || index < 0 || index >= steps.length) {
        throw new Error('Sidebar step index is outside annotationSteps')
      }
      const shouldRevealStep = shouldReveal || index !== currentIndex || (list.hidden && visible)
      currentIndex = index
      list.hidden = !visible
      listViewport.hidden = !visible
      buttons.forEach((button, i) => {
        if (i === index) button.setAttribute('aria-current', 'step')
        else button.removeAttribute('aria-current')
      })
      layout()
      updateScrollIndicators()
      if (shouldRevealStep && visible) {
        cancelAnimationFrame(scrollFrame)
        scrollFrame = requestAnimationFrame(revealCurrentStep)
      }
    },
  }
  sidebar.update({ index: 0, visible: false })
  return sidebar
}
