import { Config } from '../../../../../../../../config/types';
import { Field } from '../../../../../../../../fields/config/types';

export const getBaseFields = (config: Config): Field[] => [
  {
    name: 'text',
    label: 'Text to display',
    type: 'text',
    required: true,
  },
  {
    name: 'linkType',
    label: 'Link Type',
    type: 'radio',
    required: true,
    admin: {
      description: 'Choose between entering a custom text URL or linking to another document.',
    },
    defaultValue: 'custom',
    options: [
      {
        label: 'Custom URL',
        value: 'custom',
      },
      {
        label: 'Internal Link',
        value: 'internal',
      },
    ],
  },
  {
    name: 'url',
    label: 'Enter a URL',
    type: 'text',
    required: true,
    admin: {
      condition: ({ linkType, url }) => {
        return (typeof linkType === 'undefined' && url) || linkType === 'custom';
      },
    },
  },
  {
    name: 'doc',
    label: 'Choose a document to link to',
    type: 'relationship',
    required: true,
    relationTo: config.collections.map(({ slug }) => slug),
    admin: {
      condition: ({ linkType }) => {
        return linkType === 'internal';
      },
    },
  },
  {
    name: 'newTab',
    label: 'Open in new tab',
    type: 'checkbox',
  },
];
