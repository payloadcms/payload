import type { FormState, SanitizedCollectionConfig } from 'payload/types'

export type Props = {
  collectionSlug: string
  initialState?: FormState
  onChange?: (file?: File) => void
  updatedAt?: string
  uploadConfig: SanitizedCollectionConfig['upload']
}
