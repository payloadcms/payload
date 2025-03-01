import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { transformWhereQuery } from '../utilities/transformWhereQuery.js'
import { validateWhereQuery } from '../utilities/validateWhereQuery.js'
import { getAccess } from './access.js'
import { getConstraints } from './constraints.js'
export const listPresetsCollectionSlug = 'payload-list-presets'

export const getListPresetsConfig = (config: Config): CollectionConfig => ({
  slug: listPresetsCollectionSlug,
  access: getAccess(config),
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
    getConstraints(config),
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
