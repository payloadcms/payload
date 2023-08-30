import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js'

export type Props = {
  collection: SanitizedCollectionConfig
  handleChange?: (sort: string) => void
  modifySearchQuery?: boolean
  sort?: string
}
