import type { SanitizedCollectionConfig } from 'payload/types'

export type Props = {
  collection: SanitizedCollectionConfig
  resetParams: () => void
  title?: string
}
