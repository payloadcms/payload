import type { Element } from 'slate'

export type RelationshipElementType = {
  relationTo: string
  value: {
    id: number | string
  } | null
} & Element
