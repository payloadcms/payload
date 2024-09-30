import type { SanitizedCollectionConfig, VerifyConfig } from 'payload'

export type Props = {
  className?: string
  collectionSlug: SanitizedCollectionConfig['slug']
  disableLocalStrategy?: boolean
  email: string
  loginWithUsername: SanitizedCollectionConfig['auth']['loginWithUsername']
  operation: 'create' | 'update'
  readOnly: boolean
  requirePassword?: boolean
  setSchemaPath: (path: string) => void
  setValidateBeforeSubmit: (validate: boolean) => void
  useAPIKey?: boolean
  username: string
  verify?: boolean | VerifyConfig
}
