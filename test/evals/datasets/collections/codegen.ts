import type { EvalCase } from '../../types.js'
export const collectionsCodegenDataset: EvalCase[] = [
  {
    category: 'collections',
    configPath: 'collections/codegen/posts-title-content',
    input:
      'Add a "posts" collection with a required text field "title" and a richText field "content". Export it as a named TypeScript constant and add it to the config.',
    verify: ({
      config: {
        collections: { posts },
      },
      expect,
      score,
    }) => {
      expect(posts).toBeDefined()
      expect(posts?.fields.title).toMatchObject({ type: 'text', required: true })
      expect(posts?.fields.content).toMatchObject({ type: 'richText' })
      return score(
        'CollectionConfig with slug "posts" added to collections, fields array with a text field named title with required: true, and a richText field named content',
      )
    },
  },
  {
    category: 'collections',
    configPath: 'collections/codegen/categories-relationship',
    input:
      'Add a "categories" collection with a text field "name" and a relationship field "posts" that relates to the "posts" collection with hasMany: true.',
    verify: ({
      config: {
        collections: { categories },
      },
      expect,
      score,
    }) => {
      expect(categories).toBeDefined()
      expect(categories?.fields.name).toMatchObject({ type: 'text' })
      expect(categories?.fields.posts).toMatchObject({
        type: 'relationship',
        hasMany: true,
        relationTo: 'posts',
      })
      return score(
        'CollectionConfig with slug "categories" added to collections, text field named name, relationship field named posts with relationTo: "posts" and hasMany: true',
      )
    },
  },
  {
    category: 'collections',
    configPath: 'collections/codegen/media-access-control',
    input:
      'Add a "media" collection with access control that allows anyone to read but requires authentication for create, update, and delete operations.',
    verify: ({
      config: {
        collections: { media },
      },
      expect,
      score,
    }) => {
      expect(media).toBeDefined()
      expect(media?.access?.read).toBeDefined()
      expect(media?.access?.create).toBeDefined()
      expect(media?.access?.update).toBeDefined()
      expect(media?.access?.delete).toBeDefined()
      return score(
        'CollectionConfig with slug "media" added to collections, access object with a read function returning true unconditionally, and create/update/delete functions that check req.user',
      )
    },
  },
  {
    category: 'collections',
    configPath: 'collections/codegen/comments-relationships',
    input:
      'Add a "comments" collection with a required textarea field "body", a required relationship to "posts" named "post", and a required relationship to "users" named "author".',
    verify: ({
      config: {
        collections: { comments },
      },
      expect,
      score,
    }) => {
      expect(comments).toBeDefined()
      expect(comments?.fields.body).toMatchObject({ type: 'textarea', required: true })
      expect(comments?.fields.post).toMatchObject({
        type: 'relationship',
        relationTo: 'posts',
        required: true,
      })
      expect(comments?.fields.author).toMatchObject({
        type: 'relationship',
        relationTo: 'users',
        required: true,
      })
      return score(
        'CollectionConfig with slug "comments" added to collections, textarea field named body, relationship field post with relationTo: "posts" and required: true, relationship field author with relationTo: "users" and required: true',
      )
    },
  },
  {
    category: 'collections',
    configPath: 'collections/codegen/beforechange-hook',
    input:
      'Add a beforeChange hook to the posts collection that sets the "updatedBy" field to the currently authenticated user\'s ID (req.user.id) before every save.',
    verify: ({
      config: {
        collections: { posts },
      },
      expect,
      score,
    }) => {
      expect(posts).toBeDefined()
      expect(posts?.hooks?.beforeChange).toBeDefined()
      return score(
        'hooks.beforeChange array with an async function, sets data.updatedBy from req.user?.id or req.user.id, returns data',
      )
    },
  },
  {
    category: 'collections',
    configPath: 'collections/codegen/virtual-field',
    input:
      'Add a users collection with first and last name, then add a virtual field, called "fullName", which combines the first + last in an afterRead hook to populate the value',
    verify: ({
      config: {
        collections: { users },
      },
      expect,
      score,
    }) => {
      expect(users).toBeDefined()
      expect(users?.fields.firstName).toMatchObject({ type: 'text' })
      expect(users?.fields.lastName).toMatchObject({ type: 'text' })
      expect(users?.fields.fullName).toMatchObject({ type: 'text', virtual: true })
      expect(users?.fields.fullName).toHaveProperty('hooks.afterRead')
      return score(
        'CollectionConfig with slug "users" added to collections, text fields named firstName and lastName, text field fullName with virtual: true and a field-level hooks.afterRead array whose function receives ({ siblingData }) and returns `${siblingData.firstName} ${siblingData.lastName}`',
      )
    },
  },
  {
    category: 'collections',
    configPath: 'collections/runtime/simple-post',
    input:
      'Add an onInit hook that uses the Payload Local API to create a post titled "Seeded by runtime eval".',
    verify: async ({ expect, payload }) => {
      const seededTitle = 'Seeded by runtime eval'
      const { docs } = await payload.find({
        collection: 'posts',
        where: { title: { equals: seededTitle } },
      })
      expect(docs).toHaveLength(1)
    },
  },
]
