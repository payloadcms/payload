import type { Access, Config } from '../config/types.js'
import type { Operation, Where } from '../types/index.js'

const operations: Operation[] = ['delete', 'read', 'update', 'create'] as const

export const getAccess = (config: Config): Record<Operation, Access> =>
  operations.reduce(
    (acc, operation) => {
      acc[operation] = async (args) => {
        const { req } = args

        const userDefinedAccess = config?.queryPresets?.access?.[operation]
          ? await config?.queryPresets?.access?.[operation](args)
          : undefined

        if (typeof userDefinedAccess === 'boolean') {
          return userDefinedAccess
        }

        if (!req.user) {
          return false
        }

        if (operation === 'create') {
          return true
        }

        const constraints: Where = {
          or: [
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
            {
              [`access.${operation}.constraint`]: {
                equals: 'everyone',
              },
            },
          ],
        }

        if (typeof userDefinedAccess === 'object') {
          if (!constraints.or) {
            constraints.or = []
          }

          constraints.or.push(userDefinedAccess)
        }

        return constraints
      }

      return acc
    },
    {} as Record<Operation, Access>,
  )
