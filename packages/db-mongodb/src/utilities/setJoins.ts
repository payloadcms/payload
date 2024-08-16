import type { Document, FindArgs, JoinQuery, Payload } from 'payload'

type Args = {
  collection: string
  doc: Document
  joins: JoinQuery
  payload: Payload
} & FindArgs

/**
 * fetch docs and add to the keys by path, mutating and returning the doc with paginated results
 */
export const setJoins = async ({
  collection,
  doc,
  joins = {},
  locale,
  payload,
  req,
}: Args): Promise<Document> => {
  // TODO: allow disabling of joining at the top level using `joins: false` or `?joins=false`
  // if (joins === false) return doc
  const joinConfig = payload.collections[collection].config.joins

  const promises = []

  Object.keys(joinConfig).forEach((slug) => {
    joinConfig[slug].forEach((join) => {
      // get the query options for the join off of req
      // TODO: allow disabling the join completely
      // if (joins[join.schemaPath] === false || req.query[join.schemaPath] === 'false') {
      //   continue
      // }

      const { limit, page, pagination = true, sort } = joins[join.schemaPath] || {}

      promises.push(
        payload.db
          .find({
            collection: slug,
            limit,
            locale,
            page,
            pagination,
            projection: {
              _id: 1,
            },
            req,
            sort,
            where: {
              [join.field.on]: { equals: doc._id.toString() },
            },
          })
          .then((data) => {
            // iterate schemaPath and assign to the document
            const path = join.schemaPath.split('.')
            let current = doc
            for (let i = 0; i <= path.length - 1; i++) {
              if (i === path.length - 1) {
                current[path[i]] = data
              } else {
                if (!current[path[i]]) {
                  current[path[i]] = {}
                }
                current = current[path[i]]
              }
            }
          }),
      )
    })
  })

  await Promise.all(promises)

  return doc
}
