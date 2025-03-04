import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { Option } from '../fields/config/types.js'

import { transformWhereQuery } from '../utilities/transformWhereQuery.js'
import { validateWhereQuery } from '../utilities/validateWhereQuery.js'
import { getAccess } from './access.js'
import { getConstraints } from './constraints.js'
import { type ListPreset, operations } from './types.js'

export const listPresetsCollectionSlug = 'payload-list-presets'

export const getListPresetsConfig = (config: Config): CollectionConfig => ({
  slug: listPresetsCollectionSlug,
  access: getAccess(config),
  admin: {
    hidden: true,
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'isShared',
      type: 'checkbox',
      defaultValue: false,
      validate: (isShared, { data }) => {
        const typedData = data as ListPreset

        // ensure the `isShared` is only true if all constraints are 'onlyMe'
        if (typedData?.access) {
          const someOperationsAreShared = Object.values(typedData.access).some(
            (operation) => operation.constraint !== 'onlyMe',
          )

          if (!isShared && someOperationsAreShared) {
            return 'If any constraint is not "onlyMe", the preset must be shared'
          }
        }

        return true
      },
    },
    getConstraints(config),
    {
      name: 'where',
      type: 'json',
      // hidden: true, // uncomment this when ready
      admin: {
        components: {
          Cell: '@payloadcms/ui#ListPresetsWhereCell',
          Field: '@payloadcms/ui#ListPresetsWhereField',
        },
      },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            // transform the "where" query here so that the client-side doesn't have to
            if (data?.where) {
              if (validateWhereQuery(data.where)) {
                return data.where
              } else {
                return transformWhereQuery(data.where)
              }
            }

            return data?.where
          },
        ],
      },
    },
    {
      name: 'columns',
      type: 'json',
      // hidden: true, // uncomment this when ready
      admin: {
        components: {
          Cell: '@payloadcms/ui#ListPresetsColumnsCell',
          Field: '@payloadcms/ui#ListPresetsColumnsField',
        },
      },
      validate: (value) => {
        if (value) {
          try {
            JSON.parse(JSON.stringify(value))
          } catch {
            return 'Invalid JSON'
          }
        }

        return true
      },
    },
    {
      name: 'relatedCollection',
      type: 'select',
      admin: {
        hidden: true,
      },
      options: config.collections
        ? config.collections.reduce((acc, collection) => {
            if (collection.enableListPresets) {
              acc.push({
                label: collection.labels?.plural || collection.slug,
                value: collection.slug,
              })
            }
            return acc
          }, [] as Option[])
        : [],
      required: true,
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        const typedData = data as ListPreset

        if (operation === 'create' || operation === 'update') {
          // Ensure all operations have a constraint
          operations.forEach((operation) => {
            if (!typedData.access) {
              // @ts-expect-error expect missing properties while building up the object
              typedData.access = {}
            }

            if (!typedData.access?.[operation]) {
              // @ts-expect-error expect missing properties while building up the object
              typedData[operation] = {}
            }

            // If there is no default constraint for this operation, or if the list preset is not shared, set the constraint to 'onlyMe'
            if (!typedData.access[operation]?.constraint || !data?.isShared) {
              typedData.access[operation] = {
                ...typedData.access[operation],
                constraint: 'onlyMe',
              }
            }
          })

          // If at least one constraint is not `onlyMe` then `isShared` must be true
          if (typedData?.access) {
            const someOperationsAreShared = Object.values(typedData.access).some(
              (operation) => operation.constraint !== 'onlyMe',
            )

            typedData.isShared = someOperationsAreShared
          }
        }

        return typedData
      },
    ],
  },
  labels: {
    plural: 'List Presets',
    singular: 'List Preset',
  },
  lockDocuments: false,
})
