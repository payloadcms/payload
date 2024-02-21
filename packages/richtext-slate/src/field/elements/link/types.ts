import { Element } from 'slate'

export type LinkElementType = Element & {
  doc: Record<string, unknown>
  fields: Record<string, unknown>
  linkType: string
  newTab: boolean
  url: string
}
