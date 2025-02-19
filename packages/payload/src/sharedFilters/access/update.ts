import type { Access, Config } from '../../config/types.js'
import type { Field } from '../../fields/config/types.js'

export const updateAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  return {
    or: [
      {
        and: [
          {
            'updateConstraints.users': {
              equals: [req.user.id],
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
  }
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
      ...(config.admin?.sharedListFilters &&
      config.admin.sharedListFilters.accessOptions &&
      config.admin.sharedListFilters.accessOptions.update
        ? config.admin.sharedListFilters.accessOptions.update.map((option) => ({
            label: option.label,
            value: option.value,
          }))
        : []),
    ],
  },
  {
    name: 'updateConstraints',
    type: 'group',
    fields: [
      {
        name: 'users',
        type: 'relationship',
        admin: {
          condition: (data) =>
            Boolean(data?.updateAccess === 'specificUsers' || data?.updateAccess === 'onlyMe'),
        },
        hasMany: true,
        hooks: {
          beforeChange: [
            ({ data, req }) => {
              if (data?.updateAccess === 'onlyMe') {
                return [req.user?.id]
              }

              return data?.updateConstraints?.users
            },
          ],
        },
        relationTo: 'users',
      },
    ],
  },
]
