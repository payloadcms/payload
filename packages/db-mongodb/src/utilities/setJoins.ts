import type { MongooseQueryOptions } from 'mongoose'
import type { Document, Payload, PayloadRequest } from 'payload'

type Args = {
  collection: string
  doc: Document
  options: MongooseQueryOptions
  payload: Payload
  req: PayloadRequest
}

// TODO: pass in queryParam called `joins` to specify the pagination of each join
// joins[schemaPath][page]=2&joins[schemaPath][limit]=100

/**
 * // fetch docs and add to the keys by path
 * @param collection
 * @param doc
 * @param options
 * @param payload
 * @param req
 */
export const setJoins = async ({
  collection,
  doc,
  options,
  payload,
  req,
}: Args): Promise<Document> => {
  const joins = payload.collections[collection].joins

  await Promise.all(
    Object.keys(joins).map(async (slug) => {
      const joinModel = payload.db.collections[slug]

      for (const join of joins[slug]) {
        const joinData = await joinModel
          .find(
            { [join.field.on]: { $eq: doc._id.toString() } },
            {
              _id: 1,
            },
            options,
          )
          .limit(10)

        // iterate schemaPath and assign to the document
        const path = join.schemaPath.split('.')
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
