import type { VerifyConfig } from '../../../../../../auth/types'
import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types'

export type Props = {
  className?: string
  collection: SanitizedCollectionConfig
  email: string
  operation: 'create' | 'update'
  readOnly: boolean
  requirePassword?: boolean
  useAPIKey?: boolean
  verify?: VerifyConfig | boolean
}
