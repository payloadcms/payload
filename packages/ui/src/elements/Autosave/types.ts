import type { SanitizedGlobalConfig, SanitizedCollectionConfig } from 'payload/types'

export type Props = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: number | string
  publishedDocUpdatedAt: string
}
