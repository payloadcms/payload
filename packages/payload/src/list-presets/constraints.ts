import type { Config } from '../config/types.js'
import type { Field } from '../fields/config/types.js'

import { fieldAffectsData } from '../fields/config/types.js'
import { type ListPresetConstraint, operations } from './types.js'

export const getConstraints = (config: Config): Field => ({
  name: 'access',
  type: 'group',
  admin: {
    components: {
      Cell: '@payloadcms/ui#ListPresetsAccessCell',
    },
    condition: (data) => Boolean(data?.isShared),
  },
  fields: operations.map((operation) => ({
    name: operation,
    type: 'group',
    admin: {
      components: {
        Label: '@payloadcms/ui#ListPresetsAccessLabel',
      },
      hideGutter: true,
    },
    fields: [
      {
        name: 'constraint',
        type: 'select',
        defaultValue: 'onlyMe',
        label: false,
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
          ...(config?.listPresets?.constraints?.[operation]?.map(
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
      ...(config?.listPresets?.constraints?.[operation]?.reduce(
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
})
