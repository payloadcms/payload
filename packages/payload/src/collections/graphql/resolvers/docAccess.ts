import type { CollectionPermission, GlobalPermission } from '../../../auth/types.js'
import type { PayloadRequest } from '../../../express/types.js'

import { docAccess } from '../../operations/docAccess.js'

export type Resolver = (
  _: unknown,
  args: {
    id: number | string
  },
  context: {
    req: PayloadRequest
    res: Response
  },
) => Promise<CollectionPermission | GlobalPermission>

export function docAccessResolver(): Resolver {
  async function resolver(_, args, context) {
    return docAccess({
      id: args.id,
      req: context.req,
    })
  }

  return resolver
}
