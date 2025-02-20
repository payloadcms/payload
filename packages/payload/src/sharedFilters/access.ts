import type { Access, Config } from '../config/types.js'
import type { Where } from '../types/index.js'

import { type Field, fieldAffectsData } from '../fields/config/types.js'

type Operation = 'delete' | 'read' | 'update'

const operationMap: {
  [key in Operation]: {
    accessFieldName: string
    constraintsFieldName: string
    usersConstraintFieldName: string
  }
} = {
  delete: {
    accessFieldName: 'deleteAccess',
    constraintsFieldName: 'deleteConstraints',
    usersConstraintFieldName: 'deleteConstraints.users',
  },
  read: {
    accessFieldName: 'readAccess',
    constraintsFieldName: 'readConstraints',
    usersConstraintFieldName: 'readConstraints.users',
  },
  update: {
    accessFieldName: 'updateAccess',
    constraintsFieldName: 'updateConstraints',
    usersConstraintFieldName: 'updateConstraints.users',
  },
}

export const getAccess =
  ({ config, operation }: { config: Config; operation: Operation }): Access =>
  async (args) => {
    const { req } = args

    const userDefinedAccess = config?.admin?.sharedListFilters?.access?.[operation]
      ? await config?.admin?.sharedListFilters?.access?.[operation](args)
      : undefined

    if (typeof userDefinedAccess === 'boolean') {
      return userDefinedAccess
    }

    if (!req.user) {
      return false
    }

    const accessFieldName = operationMap[operation].accessFieldName

    const usersConstraintFieldName = operationMap[operation].usersConstraintFieldName

    const constraints = {
      or: [
        {
          and: [
            {
              [usersConstraintFieldName]: {
                in: req.user.id,
              },
            },
            {
              or: [
                {
                  [accessFieldName]: {
                    equals: 'onlyMe',
                  },
                },
                {
                  [accessFieldName]: {
                    equals: 'specificUsers',
                  },
                },
              ],
            },
          ],
        },
        {
          [accessFieldName]: {
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

export const getAccessFields = ({
  config,
  operation,
}: {
  config: Config
  operation: Operation
}): Field[] => [
  {
    name: operationMap[operation].accessFieldName,
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
      ...(config?.admin?.sharedListFilters?.accessOptions?.[operation]?.map((option) => ({
        label: option.label,
        value: option.value,
      })) || []),
    ],
  },
  {
    name: operationMap[operation].constraintsFieldName,
    type: 'group',
    fields: [
      {
        name: 'users',
        type: 'relationship',
        admin: {
          condition: (data) =>
            Boolean(data?.[operationMap[operation].accessFieldName] === 'specificUsers'),
        },
        hasMany: true,
        hooks: {
          beforeChange: [
            ({ data, req }) => {
              if (data?.[operationMap[operation].accessFieldName] === 'onlyMe') {
                if (req.user) {
                  return [req.user.id]
                }
              }

              return data?.[operationMap[operation].constraintsFieldName]?.user
            },
          ],
        },
        relationTo: 'users',
      },
      ...(config.admin?.sharedListFilters?.accessOptions?.[operation]?.reduce((acc, option) => {
        option.fields.forEach((field, index) => {
          acc.push({ ...field })

          if (fieldAffectsData(field)) {
            acc[index].admin = {
              ...(acc[index]?.admin || {}),
              condition: (data) =>
                Boolean(data?.[operationMap[operation].accessFieldName] === option.value),
            }
          }
        })

        return acc
      }, [] as Field[]) || []),
    ],
  },
]
