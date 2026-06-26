import { isHTMLElement } from 'lexical'

export function check(node: unknown) {
  return isHTMLElement(node)
}
