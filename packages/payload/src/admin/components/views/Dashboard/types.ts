import type { Permissions, User } from '../../../../auth/types'
import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../../../globals/config/types'

export type Props = {
  collections: SanitizedCollectionConfig[]
  globals: SanitizedGlobalConfig[]
  permissions: Permissions
  user: User
}
