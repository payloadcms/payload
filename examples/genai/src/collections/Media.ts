import path from 'path'
import { CollectionConfig } from 'payload/types'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'label',
  },
  upload: {
    staticDir: path.resolve(__dirname, './uploads'),
  },
  fields: [
    {
      name: 'label',
      type: 'text',
    },
    {
      name: 'transformer',
      type: 'relationship',
      relationTo: 'transformer',
    },
    {
      name: 'prompts',
      type: 'array',
      fields: [
        {
          name: 'prompt',
          type: 'relationship',
          relationTo: 'prompt',
        },
      ],
    },
    // - This field is populated by setting the query parameter 'genai=true'
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
            const { id } = data

            if (!req.query.genai) return

            return {
              genai: true,
            }
          },
        ],
      },
    },
  ],
}
