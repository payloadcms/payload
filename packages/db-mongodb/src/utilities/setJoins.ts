import type { MongooseQueryOptions } from 'mongoose'
import type { Document, Payload } from 'payload'

type Args = {
  collection: string
  doc: Document
  options: MongooseQueryOptions
  payload: Payload
}

export const setJoins = async ({ collection, doc, options, payload }: Args): Promise<Document> => {
  const joins = payload.collections[collection].joins

  await Promise.all(
    Object.keys(joins).map(async (slug) => {
      // fetch docs and add to the keys by path
      const joinModel = payload.db.collections[slug]

      for (const join of joins[slug]) {
        const joinData = await joinModel
          .find(
            { [join.field.path]: { $eq: doc._id.toString() } },
            {
              _id: 1,
            },
            options,
          )
          .limit(10)

        // iterate path and assign to the document
        const path = join.path.split('.')
        let current = doc
        for (let i = 0; i <= path.length - 1; i++) {
          if (i === path.length - 1) {
            current[path[i]] = joinData.map((a) => a._id)
          } else {
            if (!current[path[i]]) {
              current[path[i]] = {}
            }
            current = current[path[i]]
          }
        }
      }
    }),
  )

  return doc
}
