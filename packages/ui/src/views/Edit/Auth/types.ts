import type { VerifyConfig } from 'payload/auth'
import type { SanitizedCollectionConfig } from 'payload/types'

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
