import type { CodegenEvalCase } from '../../types.js'

export const collectionsCodegenDataset: CodegenEvalCase[] = [
  {
    input:
      'Add a "posts" collection with a required text field "title" and a richText field "content". Export it as a named TypeScript constant and add it to the config.',
    expected:
      'CollectionConfig with slug "posts" added to collections, fields array with a text field named title with required: true, and a richText field named content',
    category: 'collections',
    fixturePath: 'collections/codegen/posts-title-content',
    assertions: [
      { kind: 'collectionExists', slug: 'posts' },
      { field: 'title', fieldType: 'text', kind: 'fieldExists', slug: 'posts' },
      { field: 'title', kind: 'fieldOption', option: 'required', slug: 'posts', value: true },
      { field: 'content', fieldType: 'richText', kind: 'fieldExists', slug: 'posts' },
    ],
  },
  {
    input:
      'Add a "categories" collection with a text field "name" and a relationship field "posts" that relates to the "posts" collection with hasMany: true.',
    expected:
      'CollectionConfig with slug "categories" added to collections, text field named name, relationship field named posts with relationTo: "posts" and hasMany: true',
    category: 'collections',
    fixturePath: 'collections/codegen/categories-relationship',
    assertions: [
      { kind: 'collectionExists', slug: 'categories' },
      { field: 'name', fieldType: 'text', kind: 'fieldExists', slug: 'categories' },
      { field: 'posts', fieldType: 'relationship', kind: 'fieldExists', slug: 'categories' },
      {
        field: 'posts',
        kind: 'fieldOption',
        option: 'relationTo',
        slug: 'categories',
        value: 'posts',
      },
      { field: 'posts', kind: 'fieldOption', option: 'hasMany', slug: 'categories', value: true },
    ],
  },
  {
    input:
      'Add a "media" collection with access control that allows anyone to read but requires authentication for create, update, and delete operations.',
    expected:
      'CollectionConfig with slug "media" added to collections, access object with a read function returning true unconditionally, and create/update/delete functions that check req.user',
    category: 'collections',
    fixturePath: 'collections/codegen/media-access-control',
    assertions: [
      { kind: 'collectionExists', slug: 'media' },
      { kind: 'collectionAccess', operation: 'read', slug: 'media' },
      { kind: 'collectionAccess', operation: 'create', slug: 'media' },
      { kind: 'collectionAccess', operation: 'update', slug: 'media' },
      { kind: 'collectionAccess', operation: 'delete', slug: 'media' },
    ],
  },
  {
    input:
      'Add a "comments" collection with a required textarea field "body", a required relationship to "posts" named "post", and a required relationship to "users" named "author".',
    expected:
      'CollectionConfig with slug "comments" added to collections, textarea field named body, relationship field post with relationTo: "posts" and required: true, relationship field author with relationTo: "users" and required: true',
    category: 'collections',
    fixturePath: 'collections/codegen/comments-relationships',
    assertions: [
      { kind: 'collectionExists', slug: 'comments' },
      { field: 'body', fieldType: 'textarea', kind: 'fieldExists', slug: 'comments' },
      { field: 'body', kind: 'fieldOption', option: 'required', slug: 'comments', value: true },
      { field: 'post', fieldType: 'relationship', kind: 'fieldExists', slug: 'comments' },
      {
        field: 'post',
        kind: 'fieldOption',
        option: 'relationTo',
        slug: 'comments',
        value: 'posts',
      },
      { field: 'post', kind: 'fieldOption', option: 'required', slug: 'comments', value: true },
      { field: 'author', fieldType: 'relationship', kind: 'fieldExists', slug: 'comments' },
      {
        field: 'author',
        kind: 'fieldOption',
        option: 'relationTo',
        slug: 'comments',
        value: 'users',
      },
      { field: 'author', kind: 'fieldOption', option: 'required', slug: 'comments', value: true },
    ],
  },
  {
    input:
      'Add a beforeChange hook to the posts collection that sets the "updatedBy" field to the currently authenticated user\'s ID (req.user.id) before every save.',
    expected:
      'hooks.beforeChange array with an async function, sets data.updatedBy from req.user?.id or req.user.id, returns data',
    category: 'collections',
    fixturePath: 'collections/codegen/beforechange-hook',
    assertions: [
      { kind: 'collectionExists', slug: 'posts' },
      { hook: 'beforeChange', kind: 'collectionHook', slug: 'posts' },
    ],
  },
  {
    input:
      'Add a users collection with first and last name, then add a virtual field, called "fullName", which combines the first + last in an afterRead hook to populate the value',
    expected:
      'CollectionConfig with slug "users" added to collections, text fields named firstName and lastName, text field fullName with virtual: true and a field-level hooks.afterRead array whose function receives ({ siblingData }) and returns `${siblingData.firstName} ${siblingData.lastName}`',
    category: 'collections',
    fixturePath: 'collections/codegen/virtual-field',
    assertions: [
      { kind: 'collectionExists', slug: 'users' },
      { field: 'firstName', fieldType: 'text', kind: 'fieldExists', slug: 'users' },
      { field: 'lastName', fieldType: 'text', kind: 'fieldExists', slug: 'users' },
      { field: 'fullName', fieldType: 'text', kind: 'fieldExists', slug: 'users' },
      { field: 'fullName', kind: 'fieldOption', option: 'virtual', slug: 'users', value: true },
      { field: 'fullName', hook: 'afterRead', kind: 'fieldHook', slug: 'users' },
    ],
  },
]
