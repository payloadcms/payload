import { getTranslation } from '@payloadcms/translations'

import type { Config } from '../config/types.js'
import type { Field, Option } from '../fields/config/types.js'
import type { QueryPresetConstraint } from './types.js'

import { APIError } from '../errors/APIError.js'
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
  fields: operations.map((constraintOperation) => {
    const constraintOptions: Option[] = [
      ...defaultConstraintOptions,
      ...(config?.queryPresets?.constraints?.[constraintOperation]?.map(
        (option: QueryPresetConstraint) => ({
          label: option.label,
          value: option.value,
        }),
      ) || []),
    ]

    return {
      type: 'collapsible',
      fields: [
        {
          name: constraintOperation,
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
                      constraintOperation,
                    },
                  },
                },
              },
              defaultValue: 'onlyMe',
              hooks: {
                beforeValidate: [
                  ({ operation, previousValue, req, value }) => {
                    // determine if the user has access to set this constraint
                    if (
                      config.queryPresets?.allowedConstraints &&
                      (operation === 'create' || operation === 'update')
                    ) {
                      const valueIsChanging = (!previousValue && value) || previousValue !== value

                      if (valueIsChanging) {
                        const allowedConstraints = config.queryPresets.allowedConstraints({
                          allConstraints: constraintOptions.map((option) =>
                            typeof option === 'string' ? option : option.value,
                          ),
                          operation: constraintOperation,
                          req,
                        })

                        const changeNotPermitted =
                          !allowedConstraints?.includes(value) ||
                          (previousValue && !allowedConstraints?.includes(previousValue))

                        if (changeNotPermitted) {
                          throw new APIError(
                            operation === 'create'
                              ? `You are not allowed to set the "${value}" constraint.`
                              : `You are not allowed to change the "${previousValue}" constraint.`,
                            403,
                            {},
                            true,
                          )
                        }
                      }
                    }

                    return value
                  },
                ],
              },
              label: ({ i18n }) =>
                `Specify who can ${constraintOperation} this ${getTranslation(config.queryPresets?.labels?.singular || 'Preset', i18n)}`,
              options: constraintOptions,
            },
            {
              name: 'users',
              type: 'relationship',
              admin: {
                condition: (data) =>
                  Boolean(data?.access?.[constraintOperation]?.constraint === 'specificUsers'),
              },
              hasMany: true,
              hooks: {
                beforeChange: [
                  ({ data, req }) => {
                    if (data?.access?.[constraintOperation]?.constraint === 'onlyMe') {
                      if (req.user) {
                        return [req.user.id]
                      }
                    }

                    return data?.access?.[constraintOperation]?.users
                  },
                ],
              },
              relationTo: config.admin?.user ?? 'users', // TODO: remove this fallback when the args are properly typed as `SanitizedConfig`
            },
            ...(config?.queryPresets?.constraints?.[constraintOperation]?.reduce(
              (acc: Field[], option: QueryPresetConstraint) => {
                option.fields?.forEach((field, index) => {
                  acc.push({ ...field })

                  if (fieldAffectsData(field)) {
                    acc[index].admin = {
                      ...(acc[index]?.admin || {}),
                      condition: (data) =>
                        Boolean(data?.access?.[constraintOperation]?.constraint === option.value),
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
      label: () => toWords(constraintOperation),
    }
  }),
  label: 'Sharing settings',
  validate: preventLockout,
})
