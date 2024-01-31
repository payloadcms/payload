import type { SanitizedCollectionConfig } from 'payload/types'
import type { FormState } from '../../..'

export type Props = {
  uploadConfig: SanitizedCollectionConfig['upload']
  onChange?: (file?: File) => void
  updatedAt?: string
}
