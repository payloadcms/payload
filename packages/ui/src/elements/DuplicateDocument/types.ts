import type { SanitizedCollectionConfig } from 'payload/types'

export type Props = {
  id: string
  singularLabel: SanitizedCollectionConfig['labels']['singular']
  slug: string
}
