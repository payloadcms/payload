---
title: Fields
description: Field types, patterns, and configurations
tags: [payload, fields, validation, conditional]
---

# Payload CMS Fields

## Common Field Patterns

```typescript
// Auto-generate slugs
import { slugField } from 'payload'
slugField({ fieldToUse: 'title' })

// Relationship with filtering
{
  name: 'category',
  type: 'relationship',
  relationTo: 'categories',
  filterOptions: { active: { equals: true } },
}

// Conditional field
{
  name: 'featuredImage',
  type: 'upload',
  relationTo: 'media',
  admin: {
    condition: (data) => data.featured === true,
  },
}

// Virtual field
{
  name: 'fullName',
  type: 'text',
  virtual: true,
  hooks: {
    afterRead: [({ siblingData }) => `${siblingData.firstName} ${siblingData.lastName}`],
  },
}
```

## Field Types

### Text Field

```typescript
{
  name: 'title',
  type: 'text',
  required: true,
  unique: true,
  minLength: 5,
  maxLength: 100,
  index: true,
  localized: true,
  defaultValue: 'Default Title',
  validate: (value) => Boolean(value) || 'Required',
  admin: {
    placeholder: 'Enter title...',
    position: 'sidebar',
    condition: (data) => data.showTitle === true,
  },
}
```

### Rich Text (Lexical)

```typescript
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { HeadingFeature, LinkFeature } from '@payloadcms/richtext-lexical'

{
  name: 'content',
  type: 'richText',
  required: true,
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      HeadingFeature({
        enabledHeadingSizes: ['h1', 'h2', 'h3'],
      }),
      LinkFeature({
        enabledCollections: ['posts', 'pages'],
      }),
    ],
  }),
}
```

### Relationship

```typescript
// Single relationship
{
  name: 'author',
  type: 'relationship',
  relationTo: 'users',
  required: true,
  maxDepth: 2,
}

// Multiple relationships (hasMany)
{
  name: 'categories',
  type: 'relationship',
  relationTo: 'categories',
  hasMany: true,
  filterOptions: {
    active: { equals: true },
  },
}

// Polymorphic relationship
{
  name: 'relatedContent',
  type: 'relationship',
  relationTo: ['posts', 'pages'],
  hasMany: true,
}
```

### Array

```typescript
{
  name: 'slides',
  type: 'array',
  minRows: 2,
  maxRows: 10,
  labels: {
    singular: 'Slide',
    plural: 'Slides',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
  ],
  admin: {
    initCollapsed: true,
  },
}
```

### Blocks

```typescript
import type { Block } from 'payload'

const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'background',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}

const ContentBlock: Block = {
  slug: 'content',
  fields: [
    {
      name: 'text',
      type: 'richText',
    },
  ],
}

{
  name: 'layout',
  type: 'blocks',
  blocks: [HeroBlock, ContentBlock],
}
```

### Select

```typescript
{
  name: 'status',
  type: 'select',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
  ],
  defaultValue: 'draft',
  required: true,
}

// Multiple select
{
  name: 'tags',
  type: 'select',
  hasMany: true,
  options: ['tech', 'news', 'sports'],
}
```

### Upload

```typescript
{
  name: 'featuredImage',
  type: 'upload',
  relationTo: 'media',
  required: true,
  filterOptions: {
    mimeType: { contains: 'image' },
  },
}
```

### Point (Geolocation)

```typescript
{
  name: 'location',
  type: 'point',
  label: 'Location',
  required: true,
}

// Query by distance
const nearbyLocations = await payload.find({
  collection: 'stores',
  where: {
    location: {
      near: [10, 20], // [longitude, latitude]
      maxDistance: 5000, // in meters
      minDistance: 1000,
    },
  },
})
```

### Join Fields (Reverse Relationships)

```typescript
// From Users collection - show user's orders
{
  name: 'orders',
  type: 'join',
  collection: 'orders',
  on: 'customer', // The field in 'orders' that references this user
}
```

### Tabs & Groups

```typescript
// Tabs
{
  type: 'tabs',
  tabs: [
    {
      label: 'Content',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'body', type: 'richText' },
      ],
    },
    {
      label: 'SEO',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
      ],
    },
  ],
}

// Group (named)
{
  name: 'meta',
  type: 'group',
  fields: [
    { name: 'title', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
}
```

## Validation

```typescript
{
  name: 'email',
  type: 'email',
  validate: (value, { operation, data, siblingData }) => {
    if (operation === 'create' && !value) {
      return 'Email is required'
    }
    if (value && !value.includes('@')) {
      return 'Invalid email format'
    }
    return true
  },
}
```
