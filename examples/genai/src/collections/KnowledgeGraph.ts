import * as neo4j from 'neo4j-driver'
import { CollectionConfig } from 'payload/types'

export const KnowledgeGraph: CollectionConfig = {
  slug: 'knowledge-graph',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'resource',
      type: 'relationship',
      relationTo: 'resource',
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            const { resource, name } = data

            const resources = await req.payload.find({
              req,
              collection: 'resource',
              where: {
                id: { equals: resource },
              },
            })

            return [
              ...resources.docs.map((res) => {
                return {
                  id: res.id,
                  name: res.resource,
                }
              }),
            ]
          },
        ],
      },
    },
    {
      name: 'query',
      type: 'relationship',
      relationTo: 'cypher-query',
    },

    // - This virtual field is populated by setting the query parameter 'genai=true'
    // - This is a virtual field used to do Retrieval-Augmented Generation (RAG)
    // - GenAI data is not stored on this field
    {
      name: 'genai',
      type: 'text',
      access: {
        create: () => false,
        update: () => false,
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            const { query, resource } = data

            if (!req.query.genai) return

            const resourceRecord = await req.payload.find({
              req,
              collection: 'resource',
              where: {
                id: { equals: resource },
              },
              limit: 1,
            })

            const NEO4J_URI = resourceRecord.docs[0].uri || process.env.NEO4J_URI
            const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
            const NEO4J_PASSWORD = resourceRecord.docs[0].key || process.env.NEO4J_PASSWORD

            const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
            const session = driver.session({ database: 'neo4j' })

            const queryRecords = await req.payload.find({
              req,
              collection: 'cypher-query',
              where: {
                id: { equals: query },
              },
            })

            const queries = queryRecords.docs.map((record) => {
              return record
            })

            let serverInfo = {}
            try {
              serverInfo = await driver.getServerInfo()
            } catch (err) {
              console.log(`genai: Connection error\n${err}\nCause: ${err.cause}`)
            }

            let records = []
            let result

            await Promise.all(
              queries.map(async ({ query, parameters, returnData, transaction }) => {
                try {
                  if ('read' == transaction) {
                    result = await session.executeRead(async (tx) => {
                      return await tx.run(query, parameters)
                    })

                    for (let record of result.records) {
                      const kgReturnData = {}
                      Object.keys(returnData).forEach((key) => {
                        kgReturnData[returnData[key]] = record.get(key)
                      })
                      records.push(kgReturnData)
                    }
                  }
                } catch (err) {
                  console.log(`genai: Neo4j Query error\n${err}\n`)
                }
              }),
            )

            await session.close()
            return {
              genai: true,
              transaction: {
                server: serverInfo,
                query: result.summary.query.text,
                records,
              },
            }
          },
        ],
      },
    },
  ],
}
