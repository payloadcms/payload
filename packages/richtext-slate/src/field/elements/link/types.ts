import type { Element } from 'slate'

export type LinkElementType = {
  doc: Record<string, unknown>
  fields: Record<string, unknown>
  linkType: string
  newTab: boolean
  url: string
} & Element
