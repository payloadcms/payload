import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { Option } from '../fields/config/types.js'

import { transformWhereQuery } from '../utilities/transformWhereQuery.js'
import { validateWhereQuery } from '../utilities/validateWhereQuery.js'
import { getAccess } from './access.js'
import { getConstraints } from './constraints.js'
import { operations, type QueryPreset } from './types.js'

export const queryPresetsCollectionSlug = 'payload-query-presets'

export const getQueryPresetsConfig = (config: Config): CollectionConfig => ({
  slug: queryPresetsCollectionSlug,
  access: getAccess(config),
  admin: {
    defaultColumns: ['title', 'isShared', 'access', 'where', 'columns'],
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
        const typedData = data as QueryPreset

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
      admin: {
        components: {
          Cell: '@payloadcms/ui#QueryPresetsWhereCell',
          Field: '@payloadcms/ui#QueryPresetsWhereField',
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
      label: 'Filters',
    },
    {
      name: 'columns',
      type: 'json',
      admin: {
        components: {
          Cell: '@payloadcms/ui#QueryPresetsColumnsCell',
          Field: '@payloadcms/ui#QueryPresetsColumnField',
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
            if (collection.enableQueryPresets) {
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
      ({ data, operation, req }) => {
        // TODO: type this
        const typedData = data as any

        if (operation === 'create' || operation === 'update') {
          // Ensure all operations have a constraint
          operations.forEach((operation) => {
            if (!typedData.access) {
              typedData.access = {}
            }

            if (!typedData.access?.[operation]) {
              typedData[operation] = {}
            }

            // Ensure all operations have a constraint
            if (!typedData.access[operation]?.constraint) {
              typedData.access[operation] = {
                ...typedData.access[operation],
                constraint: 'onlyMe',
              }
            }
          })

          // If at least one constraint is not `onlyMe` then `isShared` must be true
          if (typedData?.access) {
            const someOperationsAreShared = Object.values(typedData.access).some(
              // TODO: remove the `any` here
              (operation: any) => operation.constraint !== 'onlyMe',
            )

            typedData.isShared = someOperationsAreShared
          }
        }

        return typedData
      },
    ],
  },
  labels: {
    plural: 'Presets',
    singular: 'Preset',
    ...(config.queryPresets?.labels || {}),
  },
  lockDocuments: false,
})
