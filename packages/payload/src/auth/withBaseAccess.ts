import type { Access, AccessArgs, AccessResult, BaseAccessArgs } from '../config/types.js'
import type { AllOperations } from '../types/index.js'

type Args = {
  access?: Access
  entityType: BaseAccessArgs['entityType']
  operation: AllOperations
  slug: string
}

const authenticatedAccess: Access = ({ req }) => Boolean(req.user)

export const withBaseAccess = ({ slug, access, entityType, operation }: Args): Access => {
  const resourceAccess = access ?? authenticatedAccess

  return async (args: AccessArgs): Promise<AccessResult> => {
    const { baseAccess } = args.req.payload.config

    if (!baseAccess) {
      return resourceAccess(args)
    }

    const baseResult = await baseAccess({
      ...args,
      slug,
      entityType,
      operation,
    })

    if (baseResult === false) {
      return false
    }

    if (entityType === 'collection' && operation === 'create' && typeof baseResult === 'object') {
      throw new Error('baseAccess must return a boolean for collection create operations.')
    }

    const resourceResult = await resourceAccess(args)

    if (resourceResult === false) {
      return false
    }

    if (baseResult === true) {
      return resourceResult
    }

    if (resourceResult === true) {
      return baseResult
    }

    return {
      and: [baseResult, resourceResult],
    }
  }
}
