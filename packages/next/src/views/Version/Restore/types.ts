import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

export type Props = {
  className?: string
  collectionSlug?: SanitizedCollectionConfig['slug']
  globalSlug?: SanitizedGlobalConfig['slug']
  label: SanitizedCollectionConfig['labels']['singular']
  originalDocID: number | string
  status?: string
  versionDate: string
  versionID: string
}
