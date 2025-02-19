import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

// import { mergeListSearchAndWhere } from '../utilities/mergeListSearchAndWhere.js'
// import { validateWhereQuery } from '../utilities/validateWhereQuery.js'

export const getListFiltersCollection = (config: Config): CollectionConfig => ({
  slug: 'payload-list-filters',
  access: {
    read: ({ req }) => Boolean(req.user),
    // access is controlled on the document-level
    // will need to wire in custom operations to handle this
    // uncomment these when ready
    // create: () => false,
    // delete: () => false,
    // update: () => false,
  },
  admin: {
    // uncomment this when ready
    // hidden: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'where',
      type: 'json',
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

export default getListFiltersCollection
