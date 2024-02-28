import type { User } from 'payload/auth'

import type { SanitizedCollectionConfig } from '../collections/config/types'
import type { SanitizedGlobalConfig } from '../globals/config/types'

export const isEntityHidden = ({
  hidden,
  user,
}: {
  hidden: SanitizedCollectionConfig['admin']['hidden'] | SanitizedGlobalConfig['admin']['hidden']
  user: User
}) => {
  return typeof hidden === 'function' ? hidden({ user }) : hidden === true
}
