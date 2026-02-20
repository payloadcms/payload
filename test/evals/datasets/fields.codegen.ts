import type { EvalCase } from '../types.js'

export const fieldsCodegenDataset: EvalCase[] = [
  {
    input:
      'Write a Payload select field named "status" with three options: "draft", "published", and "archived". The field should be required and default to "draft".',
    expected:
      'type: "select", name: "status", required: true, defaultValue: "draft", options array containing draft, published, and archived (each with label and value)',
    category: 'fields',
  },
  {
    input:
      'Write a Payload array field named "images" where each item has a required text field "url" and an optional text field "alt".',
    expected:
      'type: "array", name: "images", fields array with a text field named url with required: true, and a text field named alt',
    category: 'fields',
  },
  {
    input:
      'Write a Payload group field named "seo" containing a text field "metaTitle" (max length 60) and a textarea field "metaDescription" (max length 160).',
    expected:
      'type: "group", name: "seo", fields array with text field named metaTitle with maxLength: 60, and textarea field named metaDescription with maxLength: 160',
    category: 'fields',
  },
  {
    input:
      'Write a Payload number field named "price" that only accepts values between 0 and 99999.99, and is required.',
    expected: 'type: "number", name: "price", required: true, min: 0, max: 99999.99',
    category: 'fields',
  },
  {
    input:
      'Write a Payload blocks field named "layout" that accepts two block types: a "hero" block with a "heading" text field, and a "cta" block with a "buttonLabel" text field and a "buttonUrl" text field.',
    expected:
      'type: "blocks", name: "layout", blocks array with two block configs: one slug "hero" with text field heading, one slug "cta" with text fields buttonLabel and buttonUrl',
    category: 'fields',
  },
  {
    input:
      'Write a Payload checkbox field named "isPublished" that defaults to false and shows a custom admin description "Check to make this post visible to the public".',
    expected:
      'type: "checkbox", name: "isPublished", defaultValue: false, admin.description with the specified string',
    category: 'fields',
  },
]
