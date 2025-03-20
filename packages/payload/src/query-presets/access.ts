import type { Access, Config } from '../config/types.js'
import type { Operation, Where } from '../types/index.js'

const operations: Operation[] = ['delete', 'read', 'update', 'create'] as const

export const getAccess = (config: Config): Record<Operation, Access> =>
  operations.reduce(
    (acc, operation) => {
      acc[operation] = async (args) => {
        const { req } = args

        const accessFromConfig = config?.queryPresets?.access?.[operation]
          ? await config.queryPresets.access[operation](args)
          : undefined

        // If root access control is a boolean, but there are constraints, ignore the root access control
        // This ensures that the constraint-level access is processed, instead of ignored
        // This is because the config sets defaults of `() => true`
        if (
          typeof accessFromConfig === 'boolean' &&
          !config?.queryPresets?.constraints?.[operation]
        ) {
          return accessFromConfig
        }

        if (!req.user) {
          return false
        }

        const where: Where = {
          and: [
            {
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
                // push operation-level constraints into here
              ],
            },
            // push root-level constraints into here
          ],
        }

        if (typeof accessFromConfig === 'object') {
          if (!where.and) {
            where.and = []
          }

          where.and.push(accessFromConfig)
        }

        if (config?.queryPresets?.constraints?.[operation]) {
          await Promise.all(
            config.queryPresets.constraints[operation].map(async (constraint) => {
              const accessFromConstraint = constraint?.access
                ? await constraint.access(args)
                : undefined

              if (typeof accessFromConstraint === 'boolean') {
                return accessFromConstraint
              }

              if (typeof accessFromConstraint === 'object') {
                if (!where.and) {
                  where.and = []
                }

                if (!where.and[0].or) {
                  where.and[0].or = []
                }

                where.and[0].or.push({
                  and: [
                    accessFromConstraint,
                    {
                      [`access.${operation}.constraint`]: {
                        equals: constraint.value,
                      },
                    },
                  ],
                })
              }
            }),
          )
        }

        return where
      }

      return acc
    },
    {} as Record<Operation, Access>,
  )
