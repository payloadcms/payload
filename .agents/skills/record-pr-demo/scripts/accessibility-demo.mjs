/** Observes app events for a demo; these captions are DOM text, not screen-reader output. */
export function observeAccessibility({ window: target = window, report }) {
  const document = target.document
  let observer
  const regionSelector = '[aria-live], [role="status"], [role="alert"], [role="log"]'
  const normalize = (text) => (text ?? '').replace(/\s+/g, ' ').trim()
  const keys = {
    Tab: 'Tab',
    Enter: 'Enter',
    ' ': 'Space',
    Escape: 'Esc',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Home: 'Home',
    End: 'End',
    PageUp: 'Page Up',
    PageDown: 'Page Down',
    Backspace: 'Backspace',
    Delete: 'Delete',
  }
  const keydown = (event) => {
    const eventPath = event.composedPath()
    const origin = eventPath[0]
    if (eventPath.some((element) => element.matches?.('input[type="password"], [data-private]')))
      return
    const key =
      keys[event.key] ??
      ((event.ctrlKey || event.metaKey || event.altKey) && /^[a-z0-9]$/i.test(event.key)
        ? event.key.toUpperCase()
        : undefined)
    if (!key || !event.isTrusted) return
    if (
      event.key === ' ' &&
      origin?.closest?.('input, textarea, [contenteditable]:not([contenteditable="false"])')
    )
      return
    report({
      key: [
        event.ctrlKey && 'Ctrl',
        event.metaKey && '⌘',
        event.altKey && 'Alt',
        event.shiftKey && 'Shift',
        key,
      ]
        .filter(Boolean)
        .join(' + '),
    })
  }
  const captionRegion = (region) => {
    if (!region?.isConnected) return
    for (let element = region; element; element = element.parentElement) {
      if (
        element.hidden ||
        element.getAttribute('aria-hidden') === 'true' ||
        element.getAttribute('aria-busy') === 'true'
      )
        return
      const style = target.getComputedStyle(element)
      if (style.display === 'none' || style.visibility === 'hidden') return
    }
    const live = region.getAttribute('aria-live')
    if (
      live === 'off' ||
      (!live && !['status', 'alert', 'log'].includes(region.getAttribute('role')))
    )
      return
    const text = normalize(region.textContent)
    if (text) report({ announcement: text })
  }
  const start = () => {
    report({ reset: true })
    document.addEventListener('keydown', keydown, true)
    observer = new target.MutationObserver((records) => {
      const regions = new Set()
      for (const record of records) {
        const element = record.target.nodeType === 1 ? record.target : record.target.parentElement
        const region = element?.closest(regionSelector)
        if (region) regions.add(region)
        if (record.type === 'attributes') {
          for (const nested of element.querySelectorAll(regionSelector)) regions.add(nested)
        }
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue
          if (node.matches(regionSelector)) regions.add(node)
          for (const nested of node.querySelectorAll(regionSelector)) regions.add(nested)
        }
      }
      for (const region of regions) captionRegion(region)
    })
    observer.observe(document, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-busy', 'aria-hidden', 'aria-live', 'hidden'],
    })
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', start, { once: true })
  else start()
  return () => {
    observer?.disconnect()
    document.removeEventListener('keydown', keydown, true)
    document.removeEventListener('DOMContentLoaded', start)
  }
}
