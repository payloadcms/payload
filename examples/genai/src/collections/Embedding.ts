import { CollectionConfig } from 'payload/types'

import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'

export const Embedding: CollectionConfig = {
  slug: 'embedding',
  admin: {
    useAsTitle: 'transformer',
  },
  fields: [
    {
      name: 'transformer',
      type: 'relationship',
      relationTo: 'transformer',
      required: true,
    },
    {
      name: 'source',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'prompt',
          type: 'relationship',
          relationTo: 'prompt',
        },
        {
          name: 'media',
          type: 'relationship',
          relationTo: 'media',
        },
      ],
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
            const { id, url, source, transformer } = data

            if (!req.query.genai) return

            const transformerRecord = await req.payload.find({
              req,
              collection: 'transformer',
              where: {
                id: { equals: transformer },
              },
              limit: 1,
            })

            const resource = transformerRecord.docs[0].resource
            const service = transformerRecord.docs[0].service

            const prompts = await Promise.all(
              source.map(async ({ prompt }) => {
                const record = await req.payload.find({
                  req,
                  collection: 'prompt',
                  where: {
                    id: { equals: prompt },
                  },
                  limit: 1,
                })

                return record.docs[0].prompt
              }),
            )

            const embedding = { text: [], image: [], audio: [] }
            if ('openai' === service) {
              const openAIApiKey = resource?.key || process.env.OPENAI_API_KEY
              const embeddings = new OpenAIEmbeddings({ openAIApiKey })
              embedding.text = await embeddings.embedDocuments(prompts)
            }

            return {
              generated: true,
              embedding,
            }
          },
        ],
      },
    },
  ],
}
