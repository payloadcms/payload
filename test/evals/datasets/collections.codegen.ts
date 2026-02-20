import type { EvalCase } from '../types.js'

export const collectionsCodegenDataset: EvalCase[] = [
  {
    input:
      'Write a Payload CollectionConfig for a "posts" collection with a required text field named "title" and a richText field named "content". Export it as a named TypeScript constant.',
    expected:
      'CollectionConfig type annotation, slug: "posts", fields array with a text field named title with required: true, and a richText field named content',
    category: 'collections',
  },
  {
    input:
      'Write a Payload CollectionConfig for a "categories" collection that has a text field "name" and a relationship field "posts" that relates to a "posts" collection with hasMany: true.',
    expected:
      'slug: "categories", text field named name, relationship field named posts with relationTo: "posts" and hasMany: true',
    category: 'collections',
  },
  {
    input:
      'Create a Payload CollectionConfig named "media" that has access control allowing anyone to read but requiring authentication for create, update, and delete operations.',
    expected:
      'slug: "media", access object with a read function that returns true unconditionally, and create/update/delete restricted to authenticated users (checking req.user)',
    category: 'collections',
  },
  {
    input:
      'Write a Payload CollectionConfig for a "comments" collection with a textarea field "body", a relationship to "posts" named "post", and a relationship to "users" named "author". Both relationships should be required.',
    expected:
      'slug: "comments", textarea field named body, relationship field post with relationTo: "posts" and required: true, relationship field author with relationTo: "users" and required: true',
    category: 'collections',
  },
  {
    input:
      'Create a Payload CollectionConfig with a beforeChange hook that sets an "updatedBy" field to the currently authenticated user ID (req.user.id) before every save.',
    expected:
      'hooks.beforeChange array with an async function, sets data.updatedBy from req.user?.id or req.user.id, returns data',
    category: 'collections',
  },
]
