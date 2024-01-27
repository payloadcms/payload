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
            const { id, url, prompts } = data

            if (!req.query.genai) return // TODO: Requires 'fs' module

            // Connect
            let serverInfo = {}

            try {
              const driver = neo4j.driver(
                process.env.NEO4J_URI,
                neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
              )
              serverInfo = await driver.getServerInfo()
            } catch (err) {
              console.log(`Connection error\n${err}\nCause: ${err.cause}`)
            }

            return {
              genai: true,
              transactionInfo: {
                serverInfo,
              },
            }
          },
        ],
      },
    },
  ],
}
