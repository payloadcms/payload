import type { SanitizedCollectionConfig } from 'payload/types'
import type { FormState } from '../../../forms/Form/types'

export type Props = {
  uploadConfig: SanitizedCollectionConfig['upload']
  onChange?: (file?: File) => void
  updatedAt?: string
  collectionSlug: string
  initialState?: FormState
}
