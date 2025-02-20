import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { transformWhereQuery } from '../utilities/transformWhereQuery.js'
import { validateWhereQuery } from '../utilities/validateWhereQuery.js'
import { getReadAccessFields, readAccess } from './access/read.js'
import { getUpdateAccessFields, updateAccess } from './access/update.js'

export const sharedFiltersCollectionSlug = 'payload-shared-filters'

export const getSharedFiltersCollection = (config: Config): CollectionConfig => ({
  slug: sharedFiltersCollectionSlug,
  access: {
    read: readAccess,
    update: updateAccess,
  },
  admin: {
    // hidden: true, // uncomment this when ready
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    ...getReadAccessFields(config),
    ...getUpdateAccessFields(config),
    {
      name: 'where',
      type: 'json',
      // hidden: true, // uncomment this when ready
      hooks: {
        beforeValidate: [
          ({ data }) => {
            // transform the "where" query here so that the client-side doesn't have to
            if (data?.where) {
              if (validateWhereQuery(data.where)) {
                return data
              } else {
                return transformWhereQuery(data.where)
              }
            }
          },
        ],
      },
      required: true,
    },
    {
      name: 'columns',
      type: 'json',
      // hidden: true, // uncomment this when ready
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
      options: config.collections
        ? config.collections.map((collection) => ({
            label: collection.labels?.plural || collection.slug,
            value: collection.slug,
          }))
        : [],
      required: true,
    },
  ],
  lockDocuments: false,
})
