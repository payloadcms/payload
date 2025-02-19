import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { getReadAccessFields, readAccess } from './access/read.js'
import { getUpdateAccessFields, updateAccess } from './access/update.js'

// import { mergeListSearchAndWhere } from '../utilities/mergeListSearchAndWhere.js'
// import { validateWhereQuery } from '../utilities/validateWhereQuery.js'

export const sharedFiltersCollectionSlug = 'payload-shared-filters'

export const getSharedFiltersCollection = (config: Config): CollectionConfig => ({
  slug: sharedFiltersCollectionSlug,
  access: {
    read: readAccess,
    update: updateAccess,
  },
  admin: {
    // uncomment this when ready
    // hidden: true,
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
      // uncomment this when ready
      // hidden: true,
      // TODO: wire this up properly
      // hooks: {
      //   beforeValidate: [
      //     (value) => {
      //       return mergeListSearchAndWhere({ where: value })
      //     },
      //   ],
      // },
      required: true,
      // TODO: wire this up properly
      // validate: (value) => {
      //   console.log(value)
      //   return value && validateWhereQuery(JSON.parse(value)) ? true : 'Invalid where query'
      // },
    },
    {
      name: 'columns',
      type: 'json',
      // uncomment this when ready
      // hidden: true,
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
