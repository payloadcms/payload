import type { SanitizedCollectionConfig, VerifyConfig } from 'payload'

export type Props = {
  className?: string
  collectionSlug: SanitizedCollectionConfig['slug']
  disableLocalStrategy?: boolean
  email: string
  loginWithUsername: boolean
  operation: 'create' | 'update'
  readOnly: boolean
  requirePassword?: boolean
  useAPIKey?: boolean
  verify?: VerifyConfig | boolean
}
