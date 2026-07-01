import { $getRoot } from 'lexical'
import { isHTMLElement, joinClasses } from '@payloadcms/richtext-lexical/client'

export function check(node: unknown) {
  return isHTMLElement(node) && joinClasses(['a']) && $getRoot
}
