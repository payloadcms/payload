import type { Permissions, User } from '../../../../auth/types.js'
import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../../globals/config/types.js'

export type Props = {
  collections: SanitizedCollectionConfig[]
  globals: SanitizedGlobalConfig[]
  permissions: Permissions
  user: User
}
