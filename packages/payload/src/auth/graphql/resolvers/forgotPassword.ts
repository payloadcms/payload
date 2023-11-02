import type { Collection } from '../../../collections/config/types'

import forgotPassword from '../../operations/forgotPassword'

function forgotPasswordResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: {
        email: args.email,
      },
      disableEmail: args.disableEmail,
      expiration: args.expiration,
      req: { ...context.req } as PayloadRequest,
    }

    await forgotPassword(options)
    return true
  }

  return resolver
}

export default forgotPasswordResolver
