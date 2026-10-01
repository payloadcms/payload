import type { CollectionConfig } from 'payload'

import { radioFieldsSlug } from '../../slugs.js'

const RadioFields: CollectionConfig = {
  slug: radioFieldsSlug,
  fields: [
    {
      name: 'contentType',
      type: 'radio',
      label: 'Content Type',
      admin: {
        description: 'Choose the type of content this entry represents.',
      },
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
      admin: {
        description: 'Choose the type of content this required field represents.',
      },
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
        description: 'This disabled radio field still renders its description text.',
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
        description: 'This read-only radio field should keep consistent description spacing.',
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
        description: 'Vertical radio options should match field description spacing.',
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
        description: 'Required vertical radio field with description text.',
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
        description: 'Disabled vertical radio field with description text.',
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
        description: 'Read-only vertical radio field with description text.',
      },
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
        { label: 'Podcast', value: 'podcast' },
      ],
    },
  ],
  versions: false,
}

export default RadioFields
