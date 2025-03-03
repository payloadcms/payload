import type { Config } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { ListPresetConstraint } from './types.js'

import { fieldAffectsData } from '../fields/config/types.js'

const operations = ['delete', 'read', 'update'] as const

export const getConstraints = (config: Config): Field => ({
  name: 'access',
  type: 'group',
  admin: {
    components: {
      Cell: '@payloadcms/ui#ListPresetsAccessCell',
    },
  },
  fields: operations.map((operation) => ({
    name: operation,
    type: 'group',
    fields: [
      {
        name: 'constraint',
        type: 'select',
        defaultValue: 'onlyMe',
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
          ...(config?.admin?.listPresets?.constraints?.[operation]?.map(
            (option: ListPresetConstraint) => ({
              label: option.label,
              value: option.value,
            }),
          ) || []),
        ],
      },
      {
        name: 'users',
        type: 'relationship',
        admin: {
          condition: (data) => Boolean(data?.access?.[operation]?.constraint === 'specificUsers'),
        },
        hasMany: true,
        hooks: {
          beforeChange: [
            ({ data, req }) => {
              if (data?.access?.[operation]?.constraint === 'onlyMe') {
                if (req.user) {
                  return [req.user.id]
                }
              }

              return data?.access?.[operation]?.users
            },
          ],
        },
        relationTo: 'users',
      },
      ...(config.admin?.listPresets?.constraints?.[operation]?.reduce(
        (acc: Field[], option: ListPresetConstraint) => {
          option.fields.forEach((field, index) => {
            acc.push({ ...field })

            if (fieldAffectsData(field)) {
              acc[index].admin = {
                ...(acc[index]?.admin || {}),
                condition: (data) =>
                  Boolean(data?.access?.[operation]?.constraint === option.value),
              }
            }
          })

          return acc
        },
        [] as Field[],
      ) || []),
    ],
  })),
  hooks: {
    beforeChange: [
      ({ data }) => {
        const dataToReturn = { ...data }

        // ensure all operations have a constraint
        operations.forEach((operation) => {
          if (!dataToReturn.access) {
            dataToReturn.access = {}
          }

          if (!dataToReturn.access?.[operation]) {
            dataToReturn[operation] = {}
          }

          if (!dataToReturn.access[operation]?.constraint) {
            dataToReturn.access[operation] = {
              ...dataToReturn.access[operation],
              constraint: 'onlyMe',
            }
          }
        })

        return dataToReturn.access
      },
    ],
  },
})
