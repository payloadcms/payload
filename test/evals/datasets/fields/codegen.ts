import type { CodegenEvalCase } from '../../types.js'

export const fieldsCodegenDataset: CodegenEvalCase[] = [
  {
    input:
      'Add a required select field named "status" to the posts collection with three options: "draft", "published", and "archived". The field should default to "draft".',
    expected:
      'select field with name "status", required: true, defaultValue: "draft", options array containing objects with label and value for draft, published, and archived',
    category: 'fields',
    fixturePath: 'fields/codegen/select-status',
  },
  {
    input:
      'Add an array field named "images" to the posts collection where each item has a required text field "url" and an optional text field "alt".',
    expected:
      'array field with name "images", fields array containing a text field named url with required: true, and a text field named alt',
    category: 'fields',
    fixturePath: 'fields/codegen/array-images',
  },
  {
    input:
      'Add a group field named "seo" to the posts collection containing a text field "metaTitle" with maxLength 60 and a textarea field "metaDescription" with maxLength 160.',
    expected:
      'group field with name "seo", fields array with a text field named metaTitle with maxLength: 60, and a textarea field named metaDescription with maxLength: 160',
    category: 'fields',
    fixturePath: 'fields/codegen/group-seo',
  },
  {
    input:
      'Add a required number field named "price" to the products collection that only accepts values between 0 and 99999.99.',
    expected: 'number field with name "price", required: true, min: 0, max: 99999.99',
    category: 'fields',
    fixturePath: 'fields/codegen/number-price',
  },
  {
    input:
      'Add a blocks field named "layout" to the pages collection that accepts two block types: a "hero" block with a "heading" text field, and a "cta" block with a "buttonLabel" text field and a "buttonUrl" text field.',
    expected:
      'blocks field with name "layout", blocks array with two block configs: one with slug "hero" containing a text field named heading, one with slug "cta" containing text fields buttonLabel and buttonUrl',
    category: 'fields',
    fixturePath: 'fields/codegen/blocks-layout',
  },
  {
    input:
      'Add a checkbox field named "isPublished" to the posts collection that defaults to false and shows the admin description "Check to make this post visible to the public".',
    expected:
      'checkbox field with name "isPublished", defaultValue: false, admin.description set to "Check to make this post visible to the public"',
    category: 'fields',
    fixturePath: 'fields/codegen/checkbox-ispublished',
  },
]
