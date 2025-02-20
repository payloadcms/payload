import type { Access, Config } from '../config/types.js'
import type { Where } from '../types/index.js'

import { type Field, fieldAffectsData } from '../fields/config/types.js'

const operationMap = {
  read: {
    accessFieldName: 'readAccess',
    constraintsFieldName: 'readConstraints',
    userConstraintFieldName: 'readConstraints.user',
    usersConstraintFieldName: 'readConstraints.users',
  },
  update: {
    accessFieldName: 'updateAccess',
    constraintsFieldName: 'updateConstraints',
    userConstraintFieldName: 'updateConstraints.user',
    usersConstraintFieldName: 'updateConstraints.users',
  },
}

export const getAccess =
  ({ config, operation }: { config: Config; operation: 'read' | 'update' }): Access =>
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

    const userConstraintFieldName = operationMap[operation].userConstraintFieldName

    const usersConstraintFieldName = operationMap[operation].usersConstraintFieldName

    const constraints = {
      or: [
        {
          and: [
            {
              [userConstraintFieldName]: {
                equals: req.user.id,
              },
            },
            {
              [accessFieldName]: {
                equals: 'onlyMe',
              },
            },
          ],
        },
        {
          and: [
            {
              [usersConstraintFieldName]: {
                in: req.user.id,
              },
            },
            {
              [accessFieldName]: {
                equals: 'specificUsers',
              },
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
  operation: 'read' | 'update'
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
        name: 'user',
        type: 'relationship',
        admin: {
          condition: (data) =>
            Boolean(data?.[operationMap[operation].accessFieldName] === 'onlyMe'),
        },
        hooks: {
          beforeChange: [
            ({ data, req }) => {
              if (data?.[operationMap[operation].accessFieldName] === 'onlyMe') {
                if (req.user) {
                  return req.user.id
                }
              }

              return data?.[operationMap[operation].constraintsFieldName]?.user
            },
          ],
        },
        relationTo: 'users',
      },
      {
        name: 'users',
        type: 'relationship',
        admin: {
          condition: (data) =>
            Boolean(data?.[operationMap[operation].accessFieldName] === 'specificUsers'),
        },
        hasMany: true,
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
