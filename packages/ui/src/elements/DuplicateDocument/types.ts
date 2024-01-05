import type { SanitizedCollectionConfig } from 'payload/types'

export type Props = {
  singularLabel: SanitizedCollectionConfig['labels']['singular']
  id: string
  slug: string
}
