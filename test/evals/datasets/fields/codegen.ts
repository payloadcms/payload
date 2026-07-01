import type { EvalCase } from '../../types.js'
export const fieldsCodegenDataset: EvalCase[] = [
  {
    category: 'fields',
    configPath: 'fields/codegen/select-status',
    input:
      'Add a required select field named "status" to the posts collection with three options: "draft", "published", and "archived". The field should default to "draft".',
    verify: ({
      config: {
        collections: { posts },
      },
      expect,
      score,
    }) => {
      expect(posts?.fields.status).toMatchObject({
        type: 'select',
        defaultValue: 'draft',
        required: true,
      })
      expect(posts?.fields.status).toHaveProperty('options')
      return score(
        'select field with name "status", required: true, defaultValue: "draft", options array containing objects with label and value for draft, published, and archived',
      )
    },
  },
  {
    category: 'fields',
    configPath: 'fields/codegen/array-images',
    input:
      'Add an array field named "images" to the posts collection where each item has a required text field "url" and an optional text field "alt".',
    verify: ({
      config: {
        collections: { posts },
      },
      expect,
      score,
    }) => {
      expect(posts?.fields.images).toMatchObject({ type: 'array' })
      expect(posts?.fields['images.url']).toMatchObject({ type: 'text', required: true })
      expect(posts?.fields['images.alt']).toMatchObject({ type: 'text' })
      return score(
        'array field with name "images", fields array containing a text field named url with required: true, and a text field named alt',
      )
    },
  },
  {
    category: 'fields',
    configPath: 'fields/codegen/group-seo',
    input:
      'Add a group field named "seo" to the posts collection containing a text field "metaTitle" with maxLength 60 and a textarea field "metaDescription" with maxLength 160.',
    verify: ({
      config: {
        collections: { posts },
      },
      expect,
      score,
    }) => {
      expect(posts?.fields.seo).toMatchObject({ type: 'group' })
      expect(posts?.fields['seo.metaTitle']).toMatchObject({ type: 'text', maxLength: 60 })
      expect(posts?.fields['seo.metaDescription']).toMatchObject({
        type: 'textarea',
        maxLength: 160,
      })
      return score(
        'group field with name "seo", fields array with a text field named metaTitle with maxLength: 60, and a textarea field named metaDescription with maxLength: 160',
      )
    },
  },
  {
    category: 'fields',
    configPath: 'fields/codegen/number-price',
    input:
      'Add a required number field named "price" to the products collection that only accepts values between 0 and 99999.99.',
    verify: ({
      config: {
        collections: { products },
      },
      expect,
      score,
    }) => {
      expect(products?.fields.price).toMatchObject({
        type: 'number',
        max: 99999.99,
        min: 0,
        required: true,
      })
      return score('number field with name "price", required: true, min: 0, max: 99999.99')
    },
  },
  {
    category: 'fields',
    configPath: 'fields/codegen/blocks-layout',
    input:
      'Add a blocks field named "layout" to the pages collection that accepts two block types: a "hero" block with a "heading" text field, and a "cta" block with a "buttonLabel" text field and a "buttonUrl" text field.',
    verify: ({
      config: {
        collections: { pages },
      },
      expect,
      score,
    }) => {
      expect(pages?.fields.layout).toMatchObject({ type: 'blocks' })
      expect(pages?.fields['layout.hero.heading']).toMatchObject({ type: 'text' })
      expect(pages?.fields['layout.cta.buttonLabel']).toMatchObject({ type: 'text' })
      expect(pages?.fields['layout.cta.buttonUrl']).toMatchObject({ type: 'text' })
      return score(
        'blocks field with name "layout", blocks array with two block configs: one with slug "hero" containing a text field named heading, one with slug "cta" containing text fields buttonLabel and buttonUrl',
      )
    },
  },
  {
    category: 'fields',
    configPath: 'fields/codegen/checkbox-ispublished',
    input:
      'Add a checkbox field named "isPublished" to the posts collection that defaults to false and shows the admin description "Check to make this post visible to the public".',
    verify: ({
      config: {
        collections: { posts },
      },
      expect,
      score,
    }) => {
      expect(posts?.fields.isPublished).toMatchObject({
        type: 'checkbox',
        defaultValue: false,
      })
      expect(posts?.fields.isPublished).toHaveProperty('admin')
      return score(
        'checkbox field with name "isPublished", defaultValue: false, admin.description set to "Check to make this post visible to the public"',
      )
    },
  },
]
