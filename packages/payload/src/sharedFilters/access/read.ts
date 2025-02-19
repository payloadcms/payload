import type { Access, Config } from '../../config/types.js'
import type { Field } from '../../fields/config/types.js'

export const readAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  return {
    or: [
      {
        and: [
          {
            'readConstraints.users': {
              equals: [req.user.id],
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
  }
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
      ...(config.admin?.sharedListFilters &&
      config.admin.sharedListFilters.accessOptions &&
      config.admin.sharedListFilters.accessOptions.read
        ? config.admin.sharedListFilters.accessOptions.read.map((option) => ({
            label: option.label,
            value: option.value,
          }))
        : []),
    ],
  },
  {
    name: 'readConstraints',
    type: 'group',
    fields: [
      {
        name: 'users',
        type: 'relationship',
        admin: {
          condition: (data) =>
            Boolean(data?.readAccess === 'specificUsers' || data?.readAccess === 'onlyMe'),
        },
        hasMany: true,
        hooks: {
          beforeChange: [
            ({ data, req }) => {
              if (data?.readAccess === 'onlyMe') {
                return [req.user?.id]
              }

              return data?.readConstraints?.users
            },
          ],
        },
        relationTo: 'users',
      },
    ],
  },
]
