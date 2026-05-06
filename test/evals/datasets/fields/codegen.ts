import type { CodegenEvalCase } from '../../types.js'

export const fieldsCodegenDataset: CodegenEvalCase[] = [
  {
    input:
      'Add a required select field named "status" to the posts collection with three options: "draft", "published", and "archived". The field should default to "draft".',
    expected:
      'select field with name "status", required: true, defaultValue: "draft", options array containing objects with label and value for draft, published, and archived',
    category: 'fields',
    fixturePath: 'fields/codegen/select-status',
    assertions: [
      { field: 'status', fieldType: 'select', kind: 'fieldExists', slug: 'posts' },
      { field: 'status', kind: 'fieldOption', option: 'required', slug: 'posts', value: true },
      {
        field: 'status',
        kind: 'fieldOption',
        option: 'defaultValue',
        slug: 'posts',
        value: 'draft',
      },
      { field: 'status', kind: 'fieldOption', option: 'options', slug: 'posts' },
    ],
  },
  {
    input:
      'Add an array field named "images" to the posts collection where each item has a required text field "url" and an optional text field "alt".',
    expected:
      'array field with name "images", fields array containing a text field named url with required: true, and a text field named alt',
    category: 'fields',
    fixturePath: 'fields/codegen/array-images',
    assertions: [
      { field: 'images', fieldType: 'array', kind: 'fieldExists', slug: 'posts' },
      {
        field: 'url',
        fieldType: 'text',
        kind: 'fieldExists',
        parentField: 'images',
        slug: 'posts',
      },
      {
        field: 'url',
        kind: 'fieldOption',
        option: 'required',
        parentField: 'images',
        slug: 'posts',
        value: true,
      },
      {
        field: 'alt',
        fieldType: 'text',
        kind: 'fieldExists',
        parentField: 'images',
        slug: 'posts',
      },
    ],
  },
  {
    input:
      'Add a group field named "seo" to the posts collection containing a text field "metaTitle" with maxLength 60 and a textarea field "metaDescription" with maxLength 160.',
    expected:
      'group field with name "seo", fields array with a text field named metaTitle with maxLength: 60, and a textarea field named metaDescription with maxLength: 160',
    category: 'fields',
    fixturePath: 'fields/codegen/group-seo',
    assertions: [
      { field: 'seo', fieldType: 'group', kind: 'fieldExists', slug: 'posts' },
      {
        field: 'metaTitle',
        fieldType: 'text',
        kind: 'fieldExists',
        parentField: 'seo',
        slug: 'posts',
      },
      {
        field: 'metaTitle',
        kind: 'fieldOption',
        option: 'maxLength',
        parentField: 'seo',
        slug: 'posts',
        value: 60,
      },
      {
        field: 'metaDescription',
        fieldType: 'textarea',
        kind: 'fieldExists',
        parentField: 'seo',
        slug: 'posts',
      },
      {
        field: 'metaDescription',
        kind: 'fieldOption',
        option: 'maxLength',
        parentField: 'seo',
        slug: 'posts',
        value: 160,
      },
    ],
  },
  {
    input:
      'Add a required number field named "price" to the products collection that only accepts values between 0 and 99999.99.',
    expected: 'number field with name "price", required: true, min: 0, max: 99999.99',
    category: 'fields',
    fixturePath: 'fields/codegen/number-price',
    assertions: [
      { field: 'price', fieldType: 'number', kind: 'fieldExists', slug: 'products' },
      { field: 'price', kind: 'fieldOption', option: 'required', slug: 'products', value: true },
      { field: 'price', kind: 'fieldOption', option: 'min', slug: 'products', value: 0 },
      { field: 'price', kind: 'fieldOption', option: 'max', slug: 'products', value: 99999.99 },
    ],
  },
  {
    input:
      'Add a blocks field named "layout" to the pages collection that accepts two block types: a "hero" block with a "heading" text field, and a "cta" block with a "buttonLabel" text field and a "buttonUrl" text field.',
    expected:
      'blocks field with name "layout", blocks array with two block configs: one with slug "hero" containing a text field named heading, one with slug "cta" containing text fields buttonLabel and buttonUrl',
    category: 'fields',
    fixturePath: 'fields/codegen/blocks-layout',
    assertions: [
      { field: 'layout', fieldType: 'blocks', kind: 'fieldExists', slug: 'pages' },
      {
        blockSlug: 'hero',
        field: 'layout',
        fieldType: 'text',
        kind: 'blockField',
        slug: 'pages',
        subfield: 'heading',
      },
      {
        blockSlug: 'cta',
        field: 'layout',
        fieldType: 'text',
        kind: 'blockField',
        slug: 'pages',
        subfield: 'buttonLabel',
      },
      {
        blockSlug: 'cta',
        field: 'layout',
        fieldType: 'text',
        kind: 'blockField',
        slug: 'pages',
        subfield: 'buttonUrl',
      },
    ],
  },
  {
    input:
      'Add a checkbox field named "isPublished" to the posts collection that defaults to false and shows the admin description "Check to make this post visible to the public".',
    expected:
      'checkbox field with name "isPublished", defaultValue: false, admin.description set to "Check to make this post visible to the public"',
    category: 'fields',
    fixturePath: 'fields/codegen/checkbox-ispublished',
    assertions: [
      { field: 'isPublished', fieldType: 'checkbox', kind: 'fieldExists', slug: 'posts' },
      {
        field: 'isPublished',
        kind: 'fieldOption',
        option: 'defaultValue',
        slug: 'posts',
        value: false,
      },
      { field: 'isPublished', kind: 'fieldOption', option: 'admin', slug: 'posts' },
    ],
  },
]
