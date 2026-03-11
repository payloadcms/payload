import type { CodegenEvalCase } from '../../types.js'

export const collectionsCodegenDataset: CodegenEvalCase[] = [
  {
    input:
      'Add a "posts" collection with a required text field "title" and a richText field "content". Export it as a named TypeScript constant and add it to the config.',
    expected:
      'CollectionConfig with slug "posts" added to collections, fields array with a text field named title with required: true, and a richText field named content',
    category: 'collections',
    fixturePath: 'collections/codegen/posts-title-content',
  },
  {
    input:
      'Add a "categories" collection with a text field "name" and a relationship field "posts" that relates to the "posts" collection with hasMany: true.',
    expected:
      'CollectionConfig with slug "categories" added to collections, text field named name, relationship field named posts with relationTo: "posts" and hasMany: true',
    category: 'collections',
    fixturePath: 'collections/codegen/categories-relationship',
  },
  {
    input:
      'Add a "media" collection with access control that allows anyone to read but requires authentication for create, update, and delete operations.',
    expected:
      'CollectionConfig with slug "media" added to collections, access object with a read function returning true unconditionally, and create/update/delete functions that check req.user',
    category: 'collections',
    fixturePath: 'collections/codegen/media-access-control',
  },
  {
    input:
      'Add a "comments" collection with a required textarea field "body", a required relationship to "posts" named "post", and a required relationship to "users" named "author".',
    expected:
      'CollectionConfig with slug "comments" added to collections, textarea field named body, relationship field post with relationTo: "posts" and required: true, relationship field author with relationTo: "users" and required: true',
    category: 'collections',
    fixturePath: 'collections/codegen/comments-relationships',
  },
  {
    input:
      'Add a beforeChange hook to the posts collection that sets the "updatedBy" field to the currently authenticated user\'s ID (req.user.id) before every save.',
    expected:
      'hooks.beforeChange array with an async function, sets data.updatedBy from req.user?.id or req.user.id, returns data',
    category: 'collections',
    fixturePath: 'collections/codegen/beforechange-hook',
  },
]
