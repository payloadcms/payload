import { isHTMLElement } from '@payloadcms/richtext-lexical/client'

export function check(node: unknown) {
  return isHTMLElement(node)
}
