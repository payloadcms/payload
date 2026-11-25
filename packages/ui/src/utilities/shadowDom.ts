/** Find the active control through any open shadow roots. */
export function getDeepestActiveElement({
  root = document,
}: { root?: Document | ShadowRoot } = {}): Element | null {
  let activeElement = root.activeElement

  while (activeElement?.shadowRoot?.activeElement) {
    activeElement = activeElement.shadowRoot.activeElement
  }

  return activeElement
}

export function getRootNode({ element }: { element?: Element | null }): Document | ShadowRoot {
  const root = element?.getRootNode()

  return root?.nodeType === Node.DOCUMENT_FRAGMENT_NODE && 'host' in root
    ? (root as ShadowRoot)
    : (element?.ownerDocument ?? document)
}

/** Continue from the top of a shadow tree through its host. */
export function getComposedParent({ element }: { element: Element }): Element | null {
  if (element.assignedSlot) {
    return element.assignedSlot
  }

  if (element.parentElement) {
    return element.parentElement
  }

  const root = element.getRootNode()

  return root.nodeType === Node.DOCUMENT_FRAGMENT_NODE && 'host' in root
    ? (root as ShadowRoot).host
    : null
}

export function isComposedDescendant({
  ancestor,
  element,
}: {
  ancestor: Element | null
  element: Element | null
}): boolean {
  let current = element

  while (current) {
    if (current === ancestor) {
      return true
    }

    current = getComposedParent({ element: current })
  }

  return false
}

export function isWithinInertTree({ element }: { element: Element }): boolean {
  let current: Element | null = element

  while (current) {
    if (current.hasAttribute('inert')) {
      return true
    }

    current = getComposedParent({ element: current })
  }

  return false
}
