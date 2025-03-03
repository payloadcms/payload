import type { Access, Config } from '../config/types.js'
import type { Where } from '../types/index.js'

type Operation = 'delete' | 'read' | 'update'

const operations = ['delete', 'read', 'update'] as const

export const getAccess = (config: Config): Record<Operation, Access> =>
  operations.reduce(
    (acc, operation) => {
      acc[operation] = async (args) => {
        const { req } = args

        // TODO: wire this up when `collectionSlug` is available
        // if (config?.collections?.[collectionSlug]?.admin.disableListPresets) {
        //   return false
        // }

        const userDefinedAccess = config?.admin?.listPresets?.access?.[operation]
          ? await config?.admin?.listPresets?.access?.[operation](args)
          : undefined

        if (typeof userDefinedAccess === 'boolean') {
          return userDefinedAccess
        }

        if (!req.user) {
          return false
        }

        const constraints = {
          or: [
            {
              and: [
                {
                  access: {
                    [operation]: {
                      users: {
                        in: [req.user.id],
                      },
                    },
                  },
                },
                {
                  access: {
                    [operation]: {
                      constraint: {
                        in: ['onlyMe', 'specificUsers'],
                      },
                    },
                  },
                },
              ],
            },
            {
              access: {
                [operation]: {
                  constraint: {
                    equals: 'everyone',
                  },
                },
              },
            },
          ],
        } satisfies Where

        if (typeof userDefinedAccess === 'object') {
          constraints.or.push(userDefinedAccess)
        }

        return constraints
      }

      return acc
    },
    {} as Record<Operation, Access>,
  )
