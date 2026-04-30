import type { CollectionConfig } from 'payload'

import { radioFieldsSlug } from '../../slugs.js'

const RadioFields: CollectionConfig = {
  slug: radioFieldsSlug,
  fields: [
    {
      name: 'contentType',
      type: 'radio',
      label: 'Content Type',
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
        { label: 'Podcast', value: 'podcast' },
      ],
    },
    {
      name: 'contentTypeRequired',
      type: 'radio',
      label: 'Content Type (Required)',
      required: true,
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
        { label: 'Podcast', value: 'podcast' },
      ],
    },
    {
      name: 'contentTypeDisabled',
      type: 'radio',
      label: 'Content Type (Disabled)',
      defaultValue: 'video',
      admin: {
        disabled: true,
      },
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
        { label: 'Podcast', value: 'podcast' },
      ],
    },
    {
      name: 'contentTypeReadOnly',
      type: 'radio',
      label: 'Content Type (Read Only)',
      defaultValue: 'podcast',
      admin: {
        readOnly: true,
      },
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
        { label: 'Podcast', value: 'podcast' },
      ],
    },
    {
      name: 'contentTypeVertical',
      type: 'radio',
      label: 'Content Type (Vertical)',
      admin: {
        layout: 'vertical',
      },
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
        { label: 'Podcast', value: 'podcast' },
      ],
    },
    {
      name: 'contentTypeVerticalRequired',
      type: 'radio',
      label: 'Content Type (Vertical, Required)',
      required: true,
      admin: {
        layout: 'vertical',
      },
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
        { label: 'Podcast', value: 'podcast' },
      ],
    },
    {
      name: 'contentTypeVerticalDisabled',
      type: 'radio',
      label: 'Content Type (Vertical, Disabled)',
      defaultValue: 'article',
      admin: {
        layout: 'vertical',
        disabled: true,
      },
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
        { label: 'Podcast', value: 'podcast' },
      ],
    },
    {
      name: 'contentTypeVerticalReadOnly',
      type: 'radio',
      label: 'Content Type (Vertical, Read Only)',
      defaultValue: 'video',
      admin: {
        layout: 'vertical',
        readOnly: true,
      },
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
        { label: 'Podcast', value: 'podcast' },
      ],
    },
  ],
}

export default RadioFields
