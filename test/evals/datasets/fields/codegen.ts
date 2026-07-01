import type { EvalCase } from '../../types.js'

export const fieldsCodegenDataset: EvalCase[] = [
  {
    category: 'fields',
    configPath: 'fields/codegen/select-status',
    input:
      'Add a required select field named "status" to the posts collection with three options: "draft", "published", and "archived". The field should default to "draft".',
    verify: {
      assertions: [
        { slug: 'posts', field: 'status', fieldType: 'select', kind: 'fieldExists' },
        { slug: 'posts', field: 'status', kind: 'fieldOption', option: 'required', value: true },
        {
          slug: 'posts',
          field: 'status',
          kind: 'fieldOption',
          option: 'defaultValue',
          value: 'draft',
        },
        { slug: 'posts', field: 'status', kind: 'fieldOption', option: 'options' },
      ],
      scorer: {
        expected:
          'select field with name "status", required: true, defaultValue: "draft", options array containing objects with label and value for draft, published, and archived',
      },
    },
  },
  {
    category: 'fields',
    configPath: 'fields/codegen/array-images',
    input:
      'Add an array field named "images" to the posts collection where each item has a required text field "url" and an optional text field "alt".',
    verify: {
      assertions: [
        { slug: 'posts', field: 'images', fieldType: 'array', kind: 'fieldExists' },
        {
          slug: 'posts',
          field: 'url',
          fieldType: 'text',
          kind: 'fieldExists',
          parentField: 'images',
        },
        {
          slug: 'posts',
          field: 'url',
          kind: 'fieldOption',
          option: 'required',
          parentField: 'images',
          value: true,
        },
        {
          slug: 'posts',
          field: 'alt',
          fieldType: 'text',
          kind: 'fieldExists',
          parentField: 'images',
        },
      ],
      scorer: {
        expected:
          'array field with name "images", fields array containing a text field named url with required: true, and a text field named alt',
      },
    },
  },
  {
    category: 'fields',
    configPath: 'fields/codegen/group-seo',
    input:
      'Add a group field named "seo" to the posts collection containing a text field "metaTitle" with maxLength 60 and a textarea field "metaDescription" with maxLength 160.',
    verify: {
      assertions: [
        { slug: 'posts', field: 'seo', fieldType: 'group', kind: 'fieldExists' },
        {
          slug: 'posts',
          field: 'metaTitle',
          fieldType: 'text',
          kind: 'fieldExists',
          parentField: 'seo',
        },
        {
          slug: 'posts',
          field: 'metaTitle',
          kind: 'fieldOption',
          option: 'maxLength',
          parentField: 'seo',
          value: 60,
        },
        {
          slug: 'posts',
          field: 'metaDescription',
          fieldType: 'textarea',
          kind: 'fieldExists',
          parentField: 'seo',
        },
        {
          slug: 'posts',
          field: 'metaDescription',
          kind: 'fieldOption',
          option: 'maxLength',
          parentField: 'seo',
          value: 160,
        },
      ],
      scorer: {
        expected:
          'group field with name "seo", fields array with a text field named metaTitle with maxLength: 60, and a textarea field named metaDescription with maxLength: 160',
      },
    },
  },
  {
    category: 'fields',
    configPath: 'fields/codegen/number-price',
    input:
      'Add a required number field named "price" to the products collection that only accepts values between 0 and 99999.99.',
    verify: {
      assertions: [
        { slug: 'products', field: 'price', fieldType: 'number', kind: 'fieldExists' },
        {
          slug: 'products',
          field: 'price',
          kind: 'fieldOption',
          option: 'required',
          value: true,
        },
        { slug: 'products', field: 'price', kind: 'fieldOption', option: 'min', value: 0 },
        { slug: 'products', field: 'price', kind: 'fieldOption', option: 'max', value: 99999.99 },
      ],
      scorer: {
        expected: 'number field with name "price", required: true, min: 0, max: 99999.99',
      },
    },
  },
  {
    category: 'fields',
    configPath: 'fields/codegen/blocks-layout',
    input:
      'Add a blocks field named "layout" to the pages collection that accepts two block types: a "hero" block with a "heading" text field, and a "cta" block with a "buttonLabel" text field and a "buttonUrl" text field.',
    verify: {
      assertions: [
        { slug: 'pages', field: 'layout', fieldType: 'blocks', kind: 'fieldExists' },
        {
          slug: 'pages',
          blockSlug: 'hero',
          field: 'layout',
          fieldType: 'text',
          kind: 'blockField',
          subfield: 'heading',
        },
        {
          slug: 'pages',
          blockSlug: 'cta',
          field: 'layout',
          fieldType: 'text',
          kind: 'blockField',
          subfield: 'buttonLabel',
        },
        {
          slug: 'pages',
          blockSlug: 'cta',
          field: 'layout',
          fieldType: 'text',
          kind: 'blockField',
          subfield: 'buttonUrl',
        },
      ],
      scorer: {
        expected:
          'blocks field with name "layout", blocks array with two block configs: one with slug "hero" containing a text field named heading, one with slug "cta" containing text fields buttonLabel and buttonUrl',
      },
    },
  },
  {
    category: 'fields',
    configPath: 'fields/codegen/checkbox-ispublished',
    input:
      'Add a checkbox field named "isPublished" to the posts collection that defaults to false and shows the admin description "Check to make this post visible to the public".',
    verify: {
      assertions: [
        { slug: 'posts', field: 'isPublished', fieldType: 'checkbox', kind: 'fieldExists' },
        {
          slug: 'posts',
          field: 'isPublished',
          kind: 'fieldOption',
          option: 'defaultValue',
          value: false,
        },
        { slug: 'posts', field: 'isPublished', kind: 'fieldOption', option: 'admin' },
      ],
      scorer: {
        expected:
          'checkbox field with name "isPublished", defaultValue: false, admin.description set to "Check to make this post visible to the public"',
      },
    },
  },
]
