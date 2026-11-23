/** Returns the focused element in the same DOM root, including nested open shadow roots. */
export const getActiveElement = ({ element }: { element: Element | null }): Element | null => {
  const root = element?.getRootNode() as Document | ShadowRoot | undefined
  let activeElement = root?.activeElement ?? null

  while (activeElement?.shadowRoot?.activeElement) {
    activeElement = activeElement.shadowRoot.activeElement
  }

  return activeElement
}
