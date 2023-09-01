import type { Collection } from '../../../collections/config/types'

import logout from '../../operations/logout'

function logoutResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      req: context.req,
      res: context.res,
    }

    const result = await logout(options)

    return result
  }

  return resolver
}

export default logoutResolver
