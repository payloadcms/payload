import type { Element } from 'slate'

export type RelationshipElementType = Element & {
  relationTo: string
  value: {
    id: number | string
  } | null
}
