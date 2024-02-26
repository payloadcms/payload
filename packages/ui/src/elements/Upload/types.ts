import type { SanitizedCollectionConfig } from 'payload/types'

import type { FormState } from '../../forms/Form/types'

export type Props = {
  collectionSlug: string
  initialState?: FormState
  onChange?: (file?: File) => void
  updatedAt?: string
  uploadConfig: SanitizedCollectionConfig['upload']
}
