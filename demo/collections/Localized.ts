import { CollectionConfig } from '../../src/collections/config/types';
import { Block } from '../../src/fields/config/types';

const RichTextBlock: Block = {
  slug: 'richTextBlock',
  labels: {
    singular: 'Rich Text Block',
    plural: 'Rich Text Blocks',
  },
  fields: [
    {
      name: 'content',
      localized: true,
      type: 'richText',
      admin: {
        hideGutter: true,
      },
    },
  ],
};

const LocalizedPosts: CollectionConfig = {
  slug: 'localized-posts',
  labels: {
    singular: 'Localized Post',
    plural: 'Localized Posts',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'priority',
      'createdAt',
    ],
    enableRichTextRelationship: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      maxLength: 100,
      required: true,
      unique: true,
      localized: true,
    },
    {
      name: 'summary',
      label: 'Summary',
      type: 'text',
      index: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      type: 'richText',
      name: 'richText',
      label: 'Rich Text',
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'number',
      required: true,
      localized: true,
    },
    {
      name: 'localizedGroup',
      label: 'Localized Group',
      type: 'group',
      localized: true,
      fields: [
        {
          type: 'text',
          name: 'text',
          label: 'Text',
        },
      ],
    },
    {
      name: 'nonLocalizedGroup',
      label: 'Non-Localized Group',
      type: 'group',
      fields: [
        {
          type: 'text',
          name: 'text',
          label: 'Text',
          localized: true,
        },
      ],
    },
    {
      type: 'array',
      label: 'Non-Localized Array',
      name: 'nonLocalizedArray',
      maxRows: 3,
      fields: [
        {
          type: 'text',
          name: 'localizedEmbeddedText',
          label: 'Localized Embedded Text',
          localized: true,
        },
      ],
    },
    {
      label: 'Blocks',
      name: 'richTextBlocks',
      type: 'blocks',
      blocks: [
        RichTextBlock,
      ],
    },
  ],
  timestamps: true,
};

export default LocalizedPosts;
