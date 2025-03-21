import type { Access, Config } from '../config/types.js'
import type { Operation } from '../types/index.js'

const operations: Operation[] = ['delete', 'read', 'update', 'create'] as const

export const getAccess = (config: Config): Record<Operation, Access> =>
  operations.reduce(
    (acc, operation) => {
      acc[operation] = async (args) => {
        const { req } = args

        if (!req.user) {
          return false
        }

        const customRootAccess = config?.queryPresets?.access?.[operation]
          ? await config.queryPresets.access[operation](args)
          : undefined

        // If root access control is false, no need to continue to constraint-level access
        if (customRootAccess === false) {
          return false
        }

        return {
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
                ...(await Promise.all(
                  (config?.queryPresets?.constraints?.[operation] || []).map(async (constraint) => {
                    const customConstraintAccess = constraint.access
                      ? await constraint.access(args)
                      : undefined

                    return {
                      and: [
                        ...(typeof customConstraintAccess === 'object'
                          ? [customConstraintAccess]
                          : []),
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
            ...(typeof customRootAccess === 'object' ? [customRootAccess] : []),
          ],
        }
      }

      return acc
    },
    {} as Record<Operation, Access>,
  )
