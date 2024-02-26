import type { SanitizedCollectionConfig } from 'payload/types'

export type Props = {
  buttonId?: string
  collectionSlug: SanitizedCollectionConfig['slug']
  id?: string
  singularLabel: SanitizedCollectionConfig['labels']['singular']
  title?: string
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
}
