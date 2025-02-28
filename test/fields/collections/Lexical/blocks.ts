import type { ArrayField, Block, TextFieldSingleValidation } from 'payload'

import { BlocksFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { textFieldsSlug } from '../Text/shared.js'

async function asyncFunction(param: string) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(param?.toUpperCase())
    }, 1000)
  })
}

export const FilterOptionsBlock: Block = {
  slug: 'filterOptionsBlock',
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'groupText',
          type: 'text',
        },
        {
          name: 'dependsOnDocData',
          type: 'relationship',
          relationTo: 'text-fields',
          filterOptions: ({ data }) => {
            if (!data.title) {
              return true
            }
            return {
              text: {
                equals: data.title,
              },
            }
          },
        },
        {
          name: 'dependsOnSiblingData',
          type: 'relationship',
          relationTo: 'text-fields',
          filterOptions: ({ siblingData }) => {
            // @ts-expect-error
            if (!siblingData?.groupText) {
              return true
            }
            return {
              text: {
                equals: (siblingData as any)?.groupText,
              },
            }
          },
        },
        {
          name: 'dependsOnBlockData',
          type: 'relationship',
          relationTo: 'text-fields',
          filterOptions: ({ blockData }) => {
            if (!blockData?.text) {
              return true
            }
            return {
              text: {
                equals: blockData?.text,
              },
            }
          },
        },
      ],
    },
  ],
}

export const ValidationBlock: Block = {
  slug: 'validationBlock',
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'groupText',
          type: 'text',
        },
        {
          name: 'textDependsOnDocData',
          type: 'text',
          validate: ((value, { data }) => {
            if ((data as any)?.title === 'invalid') {
              return 'doc title cannot be invalid'
            }
            return true
          }) as TextFieldSingleValidation,
        },
        {
          name: 'textDependsOnSiblingData',
          type: 'text',
          validate: ((value, { siblingData }) => {
            if ((siblingData as any)?.groupText === 'invalid') {
              return 'textDependsOnSiblingData sibling field cannot be invalid'
            }
          }) as TextFieldSingleValidation,
        },
        {
          name: 'textDependsOnBlockData',
          type: 'text',
          validate: ((value, { blockData }) => {
            if ((blockData as any)?.text === 'invalid') {
              return 'textDependsOnBlockData sibling field cannot be invalid'
            }
          }) as TextFieldSingleValidation,
        },
      ],
    },
  ],
}

export const AsyncHooksBlock: Block = {
  slug: 'asyncHooksBlock',
  fields: [
    {
      name: 'test1',
      label: 'Text',
      type: 'text',
      hooks: {
        afterRead: [
          ({ value }) => {
            return value?.toUpperCase()
          },
        ],
      },
    },
    {
      name: 'test2',
      label: 'Text',
      type: 'text',
      hooks: {
        afterRead: [
          async ({ value }) => {
            const valuenew = await asyncFunction(value)
            return valuenew
          },
        ],
      },
    },
  ],
}

export const BlockColumns = ({ name }: { name: string }): ArrayField => ({
  type: 'array',
  name,
  interfaceName: 'BlockColumns',
  admin: {
    initCollapsed: true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'subArray',
      type: 'array',
      fields: [
        {
          name: 'requiredText',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
})
export const ConditionalLayoutBlock: Block = {
  fields: [
    {
      label: 'Layout',
      name: 'layout',
      type: 'select',
      options: ['1', '2', '3'],
      defaultValue: '1',
      required: true,
    },
    {
      ...BlockColumns({ name: 'columns' }),
      admin: {
        condition: (data, siblingData) => {
          return ['1'].includes(siblingData.layout)
        },
      },
      minRows: 1,
      maxRows: 1,
    },
    {
      ...BlockColumns({ name: 'columns2' }),
      admin: {
        condition: (data, siblingData) => {
          return ['2'].includes(siblingData.layout)
        },
      },
      minRows: 2,
      maxRows: 2,
    },
    {
      ...BlockColumns({ name: 'columns3' }),
      admin: {
        condition: (data, siblingData) => {
          return ['3'].includes(siblingData.layout)
        },
      },
      minRows: 3,
      maxRows: 3,
    },
  ],
  slug: 'conditionalLayout',
}

export const TextBlock: Block = {
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
  ],
  slug: 'textRequired',
}

export const RadioButtonsBlock: Block = {
  interfaceName: 'LexicalBlocksRadioButtonsBlock',
  fields: [
    {
      name: 'radioButtons',
      type: 'radio',
      options: [
        {
          label: 'Option 1',
          value: 'option1',
        },
        {
          label: 'Option 2',
          value: 'option2',
        },
        {
          label: 'Option 3',
          value: 'option3',
        },
      ],
    },
  ],
  slug: 'radioButtons',
}

export const RichTextBlock: Block = {
  fields: [
    {
      name: 'richTextField',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          BlocksFeature({
            blocks: [
              {
                fields: [
                  {
                    name: 'subRichTextField',
                    type: 'richText',
                    editor: lexicalEditor({}),
                  },
                  {
                    name: 'subUploadField',
                    type: 'upload',
                    relationTo: 'uploads',
                  },
                ],
                slug: 'lexicalAndUploadBlock',
              },
            ],
          }),
        ],
      }),
    },
  ],
  slug: 'richTextBlock',
}

export const UploadAndRichTextBlock: Block = {
  fields: [
    {
      name: 'upload',
      type: 'upload',
      relationTo: 'uploads',
      required: true,
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor(),
    },
  ],
  slug: 'uploadAndRichText',
}

export const RelationshipHasManyBlock: Block = {
  fields: [
    {
      name: 'rel',
      type: 'relationship',
      hasMany: true,
      relationTo: [textFieldsSlug, 'uploads'],
      required: true,
    },
  ],
  slug: 'relationshipHasManyBlock',
}
export const RelationshipBlock: Block = {
  fields: [
    {
      name: 'rel',
      type: 'relationship',
      relationTo: 'uploads',
      required: true,
    },
  ],
  slug: 'relationshipBlock',
}

export const SelectFieldBlock: Block = {
  fields: [
    {
      name: 'select',
      type: 'select',
      options: [
        {
          label: 'Option 1',
          value: 'option1',
        },
        {
          label: 'Option 2',
          value: 'option2',
        },
        {
          label: 'Option 3',
          value: 'option3',
        },
        {
          label: 'Option 4',
          value: 'option4',
        },
        {
          label: 'Option 5',
          value: 'option5',
        },
      ],
    },
  ],
  slug: 'select',
}

export const SubBlockBlock: Block = {
  slug: 'subBlockLexical',
  fields: [
    {
      name: 'subBlocksLexical',
      type: 'blocks',
      blocks: [
        {
          slug: 'contentBlock',
          fields: [
            {
              name: 'richText',
              type: 'richText',
              required: true,
              editor: lexicalEditor(),
            },
          ],
        },
        {
          slug: 'textArea',
          fields: [
            {
              name: 'content',
              type: 'textarea',
              required: true,
            },
          ],
        },
        SelectFieldBlock,
      ],
    },
  ],
}

export const TabBlock: Block = {
  slug: 'tabBlock',
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tab1',
          name: 'tab1',
          fields: [
            {
              name: 'text1',
              type: 'text',
            },
          ],
        },
        {
          label: 'Tab2',
          name: 'tab2',
          fields: [
            {
              name: 'text2',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}

export const CodeBlock: Block = {
  fields: [
    {
      name: 'code',
      type: 'code',
    },
  ],
  slug: 'code',
}
