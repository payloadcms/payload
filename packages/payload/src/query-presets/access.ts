import type { Access, Config } from '../config/types.js'
import type { Operation } from '../types/index.js'

import defaultAccess from '../auth/defaultAccess.js'

const operations: Operation[] = ['delete', 'read', 'update', 'create'] as const

const defaultCollectionAccess = {
  create: defaultAccess,
  delete: defaultAccess,
  read: defaultAccess,
  unlock: defaultAccess,
  update: defaultAccess,
}

export const getAccess = (config: Config): Record<Operation, Access> =>
  operations.reduce(
    (acc, operation) => {
      acc[operation] = async (args) => {
        const { req } = args

        const collectionAccess = config?.queryPresets?.access?.[operation]
          ? await config.queryPresets.access[operation](args)
          : defaultCollectionAccess?.[operation]
            ? defaultCollectionAccess[operation](args)
            : true

        // If collection-level access control is `false`, no need to continue to document-level access
        if (collectionAccess === false) {
          return false
        }

        // The `create` operation does not affect the document-level access control
        if (operation === 'create') {
          return collectionAccess
        }

        return {
          and: [
            {
              or: [
                // Default access control ensures a user exists, but custom access control may not
                ...(req?.user
                  ? [
                      {
                        and: [
                          {
                            [`access.${operation}.users`]: {
                              in: [req.user.id],
                            },
                          },
                          {
                            [`access.${operation}.constraint`]: {
                              in: ['onlyMe', 'specificUsers'],
                            },
                          },
                        ],
                      },
                    ]
                  : []),
                {
                  [`access.${operation}.constraint`]: {
                    equals: 'everyone',
                  },
                },
                ...(await Promise.all(
                  (config?.queryPresets?.constraints?.[operation] || []).map(async (constraint) => {
                    const constraintAccess = constraint.access
                      ? await constraint.access(args)
                      : undefined

                    return {
                      and: [
                        ...(typeof constraintAccess === 'object' ? [constraintAccess] : []),
                        {
                          [`access.${operation}.constraint`]: {
                            equals: constraint.value,
                          },
                        },
                      ],
                    }
                  }),
                )),
              ],
            },
            ...(typeof collectionAccess === 'object' ? [collectionAccess] : []),
          ],
        }
      }

      return acc
    },
    {} as Record<Operation, Access>,
  )
