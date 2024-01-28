import { ChatOpenAI } from '@langchain/openai'

import { CollectionConfig } from 'payload/types'

export const Prompt: CollectionConfig = {
  slug: 'prompt',
  admin: {
    useAsTitle: 'prompt',
  },
  fields: [
    {
      name: 'prompt',
      type: 'text',
      required: true,
    },
    {
      name: 'purpose',
      type: 'select',
      required: true,
      options: [
        {
          label: 'chat',
          value: 'chat',
        },
        {
          label: 'step back',
          value: 'step-back',
        },
        {
          label: 'custom',
          value: 'custom',
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
            const { prompt, purpose } = data

            if (!req.query.genai) return

            if ('chat' === purpose) {
              const chatModel = new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
              })

              const chat = await chatModel.invoke(prompt)

              return {
                generated: true,
                purpose,
                response: chat.content,
              }
            }
          },
        ],
      },
    },
  ],
}
