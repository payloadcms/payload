'use client'

/**
 * @deprecated - remove in 4.0. lexical already exports an isHTMLElement utility
 */
export function isHTMLElement(x: unknown): x is HTMLElement {
  return x instanceof HTMLElement
}
