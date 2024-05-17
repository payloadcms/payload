import type { Payload } from 'payload'
import type { Field } from 'payload/types'

import type { PostgresAdapter } from '../../../types.js'
import type { DocsToResave } from '../types.js'

import { traverseFields } from './traverseFields.js'

type Args = {
  collectionSlug?: string
  db: PostgresAdapter
  docsToResave: DocsToResave
  fields: Field[]
  globalSlug?: string
  isVersions: boolean
  payload: Payload
}

export const fetchAndResave = async ({
  collectionSlug,
  db,
  docsToResave,
  fields,
  globalSlug,
  isVersions,
  payload,
}: Args) => {
  for (const [id, rows] of Object.entries(docsToResave)) {
    if (collectionSlug) {
      const collectionConfig = payload.collections[collectionSlug].config

      if (collectionConfig) {
        if (isVersions) {
          const { docs } = await payload.findVersions({
            collection: collectionSlug,
            depth: 0,
            fallbackLocale: null,
            locale: 'all',
            showHiddenFields: true,
            where: {
              parent: {
                equals: id,
              },
            },
          })

          for (const doc of docs) {
            traverseFields({
              doc,
              fields,
              path: '',
              rows,
            })

            // Update each doc
          }
        } else {
          const doc = await payload.findByID({
            id,
            collection: collectionSlug,
            depth: 0,
            fallbackLocale: null,
            locale: 'all',
            showHiddenFields: true,
          })

          traverseFields({
            doc,
            fields: collectionConfig.fields,
            path: '',
            rows,
          })

          // Update doc
        }
      }
    }

    if (globalSlug) {
      const globalConfig = payload.config.globals?.find((global) => global.slug === globalSlug)

      if (globalConfig) {
        if (isVersions) {
          const { docs } = await payload.findGlobalVersions({
            slug: globalSlug,
            depth: 0,
            fallbackLocale: null,
            locale: 'all',
            showHiddenFields: true,
          })

          for (const doc of docs) {
            traverseFields({
              doc,
              fields,
              path: '',
              rows,
            })

            // Update each doc
          }
        } else {
          const doc = await payload.findGlobal({
            slug: globalSlug,
            depth: 0,
            fallbackLocale: null,
            locale: 'all',
            showHiddenFields: true,
          })

          traverseFields({
            doc,
            fields: globalConfig.fields,
            path: '',
            rows,
          })

          // Update doc
        }
      }
    }
  }
}

// {
//   "1": [
//     {
//       id: 13,
//       order: null,
//       parent_id: 1,
//       path: "relation1",
//       locale: null,
//       relation_a_id: 2,
//       relation_b_id: null,
//     },
//     {
//       id: 14,
//       order: null,
//       parent_id: 1,
//       path: "myArray.0.relation2",
//       locale: null,
//       relation_a_id: null,
//       relation_b_id: 2,
//     },
//     {
//       id: 15,
//       order: null,
//       parent_id: 1,
//       path: "myArray.0.mySubArray.0.relation3",
//       locale: "es",
//       relation_a_id: null,
//       relation_b_id: 2,
//     },
//     {
//       id: 16,
//       order: null,
//       parent_id: 1,
//       path: "myArray.0.mySubArray.1.relation3",
//       locale: "es",
//       relation_a_id: null,
//       relation_b_id: 1,
//     },
//     {
//       id: 17,
//       order: null,
//       parent_id: 1,
//       path: "myArray.1.relation2",
//       locale: null,
//       relation_a_id: null,
//       relation_b_id: 1,
//     },
//     {
//       id: 18,
//       order: null,
//       parent_id: 1,
//       path: "myArray.1.mySubArray.0.relation3",
//       locale: "es",
//       relation_a_id: null,
//       relation_b_id: 1,
//     },
//     {
//       id: 19,
//       order: null,
//       parent_id: 1,
//       path: "myArray.1.mySubArray.1.relation3",
//       locale: "es",
//       relation_a_id: null,
//       relation_b_id: 2,
//     },
//     {
//       id: 20,
//       order: null,
//       parent_id: 1,
//       path: "myGroup.relation4",
//       locale: "en",
//       relation_a_id: null,
//       relation_b_id: 1,
//     },
//     {
//       id: 21,
//       order: null,
//       parent_id: 1,
//       path: "myGroup.relation4",
//       locale: "es",
//       relation_a_id: null,
//       relation_b_id: 2,
//     },
//     {
//       id: 22,
//       order: null,
//       parent_id: 1,
//       path: "myBlocks.0.relation5",
//       locale: null,
//       relation_a_id: 2,
//       relation_b_id: null,
//     },
//     {
//       id: 23,
//       order: null,
//       parent_id: 1,
//       path: "myBlocks.0.relation6",
//       locale: "es",
//       relation_a_id: null,
//       relation_b_id: 2,
//     },
//     {
//       id: 24,
//       order: null,
//       parent_id: 1,
//       path: "myBlocks.1.relation5",
//       locale: null,
//       relation_a_id: 1,
//       relation_b_id: null,
//     },
//     {
//       id: 25,
//       order: null,
//       parent_id: 1,
//       path: "myBlocks.1.relation6",
//       locale: "es",
//       relation_a_id: null,
//       relation_b_id: 1,
//     },
//   ],
// }
