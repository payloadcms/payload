import type { PayloadRequest } from 'payload/types'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'

export const isEntityHidden = ({
  hidden,
  user,
}: {
  hidden: SanitizedCollectionConfig['admin']['hidden'] | SanitizedGlobalConfig['admin']['hidden']
  user: PayloadRequest['user']
}) => {
  return typeof hidden === 'function' ? hidden({ user }) : hidden === true
}
