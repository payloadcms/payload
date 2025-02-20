import type { Access, Config } from '../../config/types.js'
import type { Where } from '../../types/index.js'

import { type Field, fieldAffectsData } from '../../fields/config/types.js'

export const getReadAccess =
  (config: Config): Access =>
  async (args) => {
    const { req } = args

    const userDefinedAccess = config?.admin?.sharedListFilters?.access?.read
      ? await config?.admin?.sharedListFilters?.access?.read(args)
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
              'readConstraints.user': {
                equals: req.user.id,
              },
            },
            {
              readAccess: {
                equals: 'onlyMe',
              },
            },
          ],
        },
        {
          and: [
            {
              'readConstraints.users': {
                in: req.user.id,
              },
            },
            {
              readAccess: {
                equals: 'specificUsers',
              },
            },
          ],
        },
        {
          readAccess: {
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

export const getReadAccessFields = (config: Config): Field[] => [
  {
    name: 'readAccess',
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
      ...(config?.admin?.sharedListFilters?.accessOptions?.read?.map((option) => ({
        label: option.label,
        value: option.value,
      })) || []),
    ],
  },
  {
    name: 'readConstraints',
    type: 'group',
    fields: [
      {
        name: 'user',
        type: 'relationship',
        admin: {
          condition: (data) => Boolean(data?.readAccess === 'onlyMe'),
        },
        hooks: {
          beforeChange: [
            ({ data, req }) => {
              if (data?.readAccess === 'onlyMe') {
                if (req.user) {
                  return req.user.id
                }
              }

              return data?.readConstraints?.user
            },
          ],
        },
        relationTo: 'users',
      },
      {
        name: 'users',
        type: 'relationship',
        admin: {
          condition: (data) => Boolean(data?.readAccess === 'specificUsers'),
        },
        hasMany: true,
        relationTo: 'users',
      },
      ...(config.admin?.sharedListFilters?.accessOptions?.read?.reduce((acc, option) => {
        option.fields.forEach((field, index) => {
          acc.push({ ...field })

          if (fieldAffectsData(field)) {
            acc[index].admin = {
              ...(acc[index]?.admin || {}),
              condition: (data) => Boolean(data?.readAccess === option.value),
            }
          }
        })

        return acc
      }, [] as Field[]) || []),
    ],
  },
]
