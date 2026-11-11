import type { CollectionConfig } from 'payload'

import {
  slugLocalizedRequiredGroupSlug,
  slugLocalizedRequiredNestedGroupSlug,
  slugLocalizedRequiredNestedTabSlug,
  slugLocalizedRequiredSiblingSlug,
  slugLocalizedRequiredSlug,
} from '../../slugs.js'

export const SlugFieldLocalizedRequired: CollectionConfig = {
  slug: slugLocalizedRequiredSlug,
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'slug', type: 'slug', localized: true, useAsSlug: 'title' },
  ],
  versions: false,
}

export const SlugFieldLocalizedRequiredSiblings: CollectionConfig[] = [
  {
    slug: slugLocalizedRequiredSiblingSlug,
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'optionalTitle', type: 'text', localized: true },
      { name: 'body', type: 'text', required: true, localized: true },
      { name: 'sharedSlug', type: 'slug', localized: true, useAsSlug: 'title' },
      { name: 'optionalSlug', type: 'slug', localized: true, useAsSlug: 'optionalTitle' },
      { name: 'fallbackSlug', type: 'slug', localized: true },
    ],
    versions: false,
  },
  {
    slug: slugLocalizedRequiredGroupSlug,
    fields: [
      { name: 'title', type: 'text', required: true },
      {
        name: 'content',
        type: 'group',
        fields: [{ name: 'body', type: 'text', required: true, localized: true }],
      },
      { name: 'slug', type: 'slug', localized: true, useAsSlug: 'title' },
    ],
    versions: false,
  },
]

export const SlugFieldLocalizedRequiredNested: CollectionConfig[] = [
  {
    slug: slugLocalizedRequiredNestedGroupSlug,
    fields: [
      { name: 'title', type: 'text', required: true },
      {
        name: 'content',
        type: 'group',
        fields: [{ name: 'slug', type: 'slug', localized: true, required: true }],
      },
      { name: 'slug', type: 'slug', localized: true, required: true, useAsSlug: 'title' },
    ],
    versions: false,
  },
  {
    slug: slugLocalizedRequiredNestedTabSlug,
    fields: [
      { name: 'title', type: 'text', required: true },
      {
        type: 'tabs',
        tabs: [
          {
            name: 'content',
            fields: [{ name: 'slug', type: 'slug', localized: true, required: true }],
          },
        ],
      },
      { name: 'slug', type: 'slug', localized: true, required: true, useAsSlug: 'title' },
    ],
    versions: false,
  },
]
