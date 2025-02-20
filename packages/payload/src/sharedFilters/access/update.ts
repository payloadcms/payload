import type { Access, Config } from '../../config/types.js'
import type { Where } from '../../types/index.js'

import { type Field, fieldAffectsData } from '../../fields/config/types.js'

export const getUpdateAccess =
  (config: Config): Access =>
  async (args) => {
    const { req } = args

    const userDefinedAccess = config?.admin?.sharedListFilters?.access?.update
      ? await config?.admin?.sharedListFilters?.access?.update(args)
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
              'updateConstraints.user': {
                equals: req.user.id,
              },
            },
            {
              updateAccess: {
                equals: 'onlyMe',
              },
            },
          ],
        },
        {
          and: [
            {
              'updateConstraints.users': {
                in: req.user.id,
              },
            },
            {
              updateAccess: {
                equals: 'specificUsers',
              },
            },
          ],
        },
        {
          updateAccess: {
            equals: 'everyone',
          },
        },
      ],
    } satisfies Where

    if (typeof userDefinedAccess === 'object') {
      constraints.or.push(userDefinedAccess)
    }

    return constraints
  }

export const getUpdateAccessFields = (config: Config): Field[] => [
  {
    name: 'updateAccess',
    type: 'select',
    options: [
      {
        label: 'Everyone',
        value: 'everyone',
      },
      {
        label: 'Only Me',
        value: 'onlyMe',
      },
      {
        label: 'Specific Users',
        value: 'specificUsers',
      },
      ...(config?.admin?.sharedListFilters?.accessOptions?.update?.map((option) => ({
        label: option.label,
        value: option.value,
      })) || []),
    ],
  },
  {
    name: `updateConstraints`,
    type: 'group',
    fields: [
      {
        name: 'user',
        type: 'relationship',
        admin: {
          condition: (data) => Boolean(data?.updateAccess === 'onlyMe'),
        },
        hooks: {
          beforeChange: [
            ({ data, req }) => {
              if (data?.updateAccess === 'onlyMe') {
                if (req.user) {
                  return req.user.id
                }
              }

              return data?.updateConstraints?.user
            },
          ],
        },
        relationTo: 'users',
      },
      {
        name: 'users',
        type: 'relationship',
        admin: {
          condition: (data) => Boolean(data?.updateAccess === 'specificUsers'),
        },
        hasMany: true,
        relationTo: 'users',
      },
      ...(config.admin?.sharedListFilters?.accessOptions?.update?.reduce((acc, option) => {
        option.fields.forEach((field, index) => {
          acc.push({ ...field })

          if (fieldAffectsData(field)) {
            acc[index].admin = {
              ...(acc[index]?.admin || {}),
              condition: (data) => Boolean(data?.updateAccess === option.value),
            }
          }
        })

        return acc
      }, [] as Field[]) || []),
    ],
  },
]
