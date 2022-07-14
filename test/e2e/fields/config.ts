import { buildConfig } from '../buildConfig';
import { devUser } from '../../credentials';
import { arrayDoc, blocksDoc, collapsibleDoc, richTextDoc, textDoc } from './shared';

export default buildConfig({
  collections: [
    {
      slug: 'array-fields',
      fields: [
        {
          name: 'items',
          type: 'array',
          required: true,
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      slug: 'block-fields',
      fields: [
        {
          name: 'blocks',
          type: 'blocks',
          required: true,
          blocks: [
            {
              slug: 'text',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              slug: 'number',
              fields: [
                {
                  name: 'number',
                  type: 'number',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'collapsible-fields',
      fields: [
        {
          label: 'Collapsible Field',
          type: 'collapsible',
          admin: {
            description: 'This is a collapsible field.',
          },
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      slug: 'rich-text-fields',
      fields: [
        {
          name: 'richText',
          type: 'richText',
          required: true,
        },
      ],
    },
    {
      slug: 'text-fields',
      admin: {
        useAsTitle: 'text',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });

    await payload.create({
      collection: 'array-fields',
      data: arrayDoc,
    });

    await payload.create({
      collection: 'block-fields',
      data: blocksDoc,
    });

    await payload.create({
      collection: 'collapsible-fields',
      data: collapsibleDoc,
    });

    const createdTextDoc = await payload.create({
      collection: 'text-fields',
      data: textDoc,
    });

    const richTextDocWithRelationship = { ...richTextDoc };
    richTextDocWithRelationship.richText[2].value = { id: createdTextDoc.id };

    await payload.create({
      collection: 'rich-text-fields',
      data: richTextDocWithRelationship,
    });
  },
});
