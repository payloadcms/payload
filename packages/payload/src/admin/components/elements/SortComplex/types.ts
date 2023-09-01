import type { SanitizedCollectionConfig } from '../../../../collections/config/types'

export type Props = {
  collection: SanitizedCollectionConfig
  handleChange?: (sort: string) => void
  modifySearchQuery?: boolean
  sort?: string
}
