import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

export type Props = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: number | string
  publishedDocUpdatedAt: string
}
