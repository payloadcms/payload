import type { Permissions, User } from 'payload/auth'
import type { ClientConfig, SanitizedCollectionConfig, SanitizedConfig } from 'payload/types'
import type { SanitizedGlobalConfig } from 'payload/types'

export type Props = {
  collections: SanitizedCollectionConfig[]
  globals: SanitizedGlobalConfig[]
  permissions: Permissions
  user: User
  config: SanitizedConfig
  clientConfig: ClientConfig
}
