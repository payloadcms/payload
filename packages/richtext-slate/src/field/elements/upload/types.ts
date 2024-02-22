import type { Element } from 'slate'

export type UploadElementType = Element & {
  fields: Record<string, unknown>
  relationTo: string
  value: {
    id: number | string
  } | null
}
