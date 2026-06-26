import { isHTMLElement } from 'lexical'
import { joinClasses } from '@payloadcms/richtext-lexical/client'

export function check(node: unknown) {
  return isHTMLElement(node) && joinClasses(['a'])
}
