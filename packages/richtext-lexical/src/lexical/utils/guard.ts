export function isHTMLElement(x: unknown): x is HTMLElement {
  return x instanceof HTMLElement
}
