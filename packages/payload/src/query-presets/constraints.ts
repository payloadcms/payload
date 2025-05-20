import { getTranslation } from '@payloadcms/translations'

import type { Config } from '../config/types.js'
import type { Field, Option } from '../fields/config/types.js'
import type { QueryPresetConstraint } from './types.js'

import { fieldAffectsData } from '../fields/config/types.js'
import { toWords } from '../utilities/formatLabels.js'
import { preventLockout } from './preventLockout.js'
import { operations } from './types.js'

const defaultConstraintOptions: Option[] = [
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
]

export const getConstraints = (config: Config): Field => ({
  name: 'access',
  type: 'group',
  admin: {
    components: {
      Cell: '@payloadcms/ui#QueryPresetsAccessCell',
    },
    condition: (data) => Boolean(data?.isShared),
  },
  fields: operations.map((operation) => {
    const constraintOptions: Option[] = [
      ...defaultConstraintOptions,
      ...(config?.queryPresets?.constraints?.[operation]?.map((option: QueryPresetConstraint) => ({
        label: option.label,
        value: option.value,
      })) || []),
    ]

    return {
      type: 'collapsible',
      fields: [
        {
          name: operation,
          type: 'group',
          admin: {
            hideGutter: true,
          },
          fields: [
            {
              name: 'constraint',
              type: 'select',
              admin: {
                components: {
                  Field: {
                    path: '@payloadcms/ui/rsc#QueryPresetsConstraintField',
                    serverProps: {
                      constraintOperation: operation,
                    },
                  },
                },
              },
              defaultValue: 'onlyMe',
              label: ({ i18n }) =>
                `Specify who can ${operation} this ${getTranslation(config.queryPresets?.labels?.singular || 'Preset', i18n)}`,
              options: constraintOptions,
              validate: (value, { req }) => {
                // ensure that the value is one of the allowed constraints
                const allowedConstraints = config.queryPresets.allowedConstraints({
                  allConstraints: constraintOptions.map((option) =>
                    typeof option === 'string' ? option : option.value,
                  ),
                  operation,
                  req,
                })

                if (!allowedConstraints.includes(value)) {
                  return 'You are not allowed to set this constraint option.'
                }

                return true
              },
            },
            {
              name: 'users',
              type: 'relationship',
              admin: {
                condition: (data) =>
                  Boolean(data?.access?.[operation]?.constraint === 'specificUsers'),
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
              relationTo: config.admin?.user ?? 'users', // TODO: remove this fallback when the args are properly typed as `SanitizedConfig`
            },
            ...(config?.queryPresets?.constraints?.[operation]?.reduce(
              (acc: Field[], option: QueryPresetConstraint) => {
                option.fields?.forEach((field, index) => {
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
          label: false,
        },
      ],
      label: () => toWords(operation),
    }
  }),
  label: 'Sharing settings',
  validate: preventLockout,
})
