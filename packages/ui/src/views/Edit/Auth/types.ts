import type { SanitizedCollectionConfig } from 'payload'

export type Props = {
  className?: string
  collectionSlug: SanitizedCollectionConfig['slug']
  email: string
  localStrategy?: SanitizedCollectionConfig['auth']['localStrategy']
  loginWithUsername: SanitizedCollectionConfig['auth']['loginWithUsername']
  operation: 'create' | 'update'
  readOnly: boolean
  requirePassword?: boolean
  setValidateBeforeSubmit: (validate: boolean) => void
  useAPIKey?: boolean
  username: string
  verify?: boolean
}
