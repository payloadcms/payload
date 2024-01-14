import type { SanitizedCollectionConfig } from 'payload/types'

export type Props = {
  collection: SanitizedCollectionConfig
  handleChange?: (sort: string) => void
  modifySearchQuery?: boolean
  sort?: string
}
