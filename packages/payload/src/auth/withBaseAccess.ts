import type { CollectionAccess } from '../collections/config/types.js'
import type { Access, AccessArgs, AccessResult } from '../config/types.js'
import type { GlobalAccess } from '../globals/config/types.js'

type CommonArgs = {
  access?: Access
  slug: string
}

type Args = (
  | {
      entityType: 'collection'
      operation: Exclude<keyof CollectionAccess, 'admin'>
    }
  | {
      entityType: 'global'
      operation: keyof GlobalAccess
    }
) &
  CommonArgs

const authenticatedAccess: Access = ({ req }) => Boolean(req.user)

export const withBaseAccess = (options: Args): Access => {
  const resourceAccess = options.access ?? authenticatedAccess

  return async (args: AccessArgs): Promise<AccessResult> => {
    const { baseAccess } = args.req.payload.config
    const baseAccessFunction =
      options.entityType === 'collection'
        ? baseAccess?.collections?.[options.operation]
        : baseAccess?.globals?.[options.operation]

    if (!baseAccessFunction) {
      return resourceAccess(args)
    }

    const baseResult = await baseAccessFunction({
      ...args,
      slug: options.slug,
    })

    if (!baseResult) {
      return false
    }

    if (
      options.entityType === 'collection' &&
      options.operation === 'create' &&
      typeof baseResult === 'object'
    ) {
      throw new Error('baseAccess must return a boolean for collection create operations.')
    }

    const resourceResult = await resourceAccess(args)

    if (!resourceResult) {
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
