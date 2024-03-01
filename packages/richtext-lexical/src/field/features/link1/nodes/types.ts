import type { SerializedElementNode, Spread } from 'lexical'

export type LinkFields = {
  // unknown, custom fields:
  [key: string]: unknown
  doc: {
    relationTo: string
    value:
      | {
          // Actual doc data, populated in afterRead hook
          [key: string]: unknown
          id: string
        }
      | string
  } | null
  linkType: 'custom' | 'internal'
  newTab: boolean
  url: string
}

export type SerializedLinkNode = Spread<
  {
    fields: LinkFields
  },
  SerializedElementNode
>
export type SerializedAutoLinkNode = SerializedLinkNode
