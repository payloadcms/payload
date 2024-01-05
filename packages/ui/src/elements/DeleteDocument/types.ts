import type { SanitizedCollectionConfig } from 'payload/types'

export type Props = {
  buttonId?: string
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
  collectionSlug: SanitizedCollectionConfig['slug']
  singularLabel: SanitizedCollectionConfig['labels']['singular']
  id?: string
  title?: string
}
