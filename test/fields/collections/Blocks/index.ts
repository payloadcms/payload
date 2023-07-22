import type { CollectionConfig } from '../../../../src/collections/config/types';
import { Field } from '../../../../src/fields/config/types';

export const blocksFieldSeedData = [
  {
    blockName: 'First block',
    blockType: 'text',
    text: 'first block',
    richText: [{
      children: [{ text: '' }],
    }],
  },
  {
    blockName: 'Second block',
    blockType: 'number',
    number: 342,
  },
  {
    blockName: 'Sub-block demonstration',
    blockType: 'subBlocks',
    subBlocks: [
      {
        blockName: 'First sub block',
        blockType: 'number',
        number: 123,
      },
      {
        blockName: 'Second sub block',
        blockType: 'text',
        text: 'second sub block',
      },
    ],
  },
  {
    blockName: 'I18n Block',
    blockType: 'i18n-text',
    text: 'first block',
  },
] as const;

export const blocksField: Field = {
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
        {
          name: 'richText',
          type: 'richText',
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
    {
      slug: 'subBlocks',
      fields: [
        {
          type: 'collapsible',
          label: 'Collapsible within Block',
          fields: [
            {
              name: 'subBlocks',
              type: 'blocks',
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
      ],
    },
    {
      slug: 'tabs',
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Tab with Collapsible',
              fields: [
                {
                  type: 'collapsible',
                  label: 'Collapsible within Block',
                  fields: [
                    {
                      // collapsible
                      name: 'textInCollapsible',
                      type: 'text',
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      // collapsible
                      name: 'textInRow',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  defaultValue: blocksFieldSeedData,
};

const BlockFields: CollectionConfig = {
  slug: 'block-fields',
  fields: [
    blocksField,
    {
      ...blocksField,
      name: 'collapsedByDefaultBlocks',
      localized: true,
      admin: {
        initCollapsed: true,
      },
    },
    {
      ...blocksField,
      name: 'localizedBlocks',
      localized: true,
    },
    {
      type: 'blocks',
      name: 'i18nBlocks',
      label: {
        en: 'Block en',
        es: 'Block es',
      },
      labels: {
        singular: {
          en: 'Block en',
          es: 'Block es',
        },
        plural: {
          en: 'Blocks en',
          es: 'Blocks es',
        },
      },
      blocks: [
        {
          slug: 'text',
          graphQL: {
            singularName: 'I18nText',
          },
          labels: {
            singular: {
              en: 'Text en',
              es: 'Text es',
            },
            plural: {
              en: 'Texts en',
              es: 'Texts es',
            },
          },
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
};

export const blocksDoc = {
  blocks: blocksFieldSeedData,
  localizedBlocks: blocksFieldSeedData,
};

export default BlockFields;
