import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

export type Props = {
  className?: string
  collectionSlug?: SanitizedCollectionConfig['slug']
  globalSlug?: SanitizedGlobalConfig['slug']
  label: SanitizedCollectionConfig['labels']['singular'] | SanitizedGlobalConfig['label']
  originalDocID: string | number
  versionDate: string
  versionID: string
}
