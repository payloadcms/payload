/* eslint-disable jest/no-if */
import mongoose from 'mongoose'

import payload from '../../packages/payload/src'
import { initPayloadTest } from '../helpers/configHelpers'

describe.skip('Relationship Object IDs Plugin', () => {
  let relations: any
  let posts: any

  beforeAll(async () => {
    await initPayloadTest({ __dirname, init: { local: true } })
  })

  it('seeds data accordingly', async () => {
    if (payload.db.name === 'mongoose') {
      const relationsQuery = await payload.find({
        collection: 'relations',
        sort: 'createdAt',
      })

      relations = relationsQuery.docs

      const postsQuery = await payload.find({
        collection: 'posts',
        sort: 'createdAt',
      })

      posts = postsQuery.docs

      expect(relationsQuery.totalDocs).toEqual(2)
      expect(postsQuery.totalDocs).toEqual(2)
    }
  })

  it('stores relations as object ids', async () => {
    if (payload.db.name === 'mongoose') {
      const docs = await payload.db.collections.relations.find()
      expect(typeof docs[0].hasOne).toBe('object')
      expect(typeof docs[0].hasOnePoly.value).toBe('object')
      expect(typeof docs[0].hasMany[0]).toBe('object')
      expect(typeof docs[0].hasManyPoly[0].value).toBe('object')
      expect(typeof docs[0].upload).toBe('object')
    }
  })

  it('can query by relationship id', async () => {
    if (payload.db.name === 'mongoose') {
      const { totalDocs } = await payload.find({
        collection: 'relations',
        where: {
          hasOne: {
            equals: posts[0].id,
          },
        },
      })

      expect(totalDocs).toStrictEqual(1)
    }
  })

  it('populates relations', () => {
    if (payload.db.name === 'mongoose') {
      const populatedPostTitle =
        // eslint-disable-next-line jest/no-if
        typeof relations[0].hasOne === 'object' ? relations[0].hasOne.title : undefined
      expect(populatedPostTitle).toBeDefined()

      const populatedUploadFilename =
        typeof relations[0].upload === 'object' ? relations[0].upload.filename : undefined

      expect(populatedUploadFilename).toBeDefined()
    }
  })

  it('can query by nested property', async () => {
    if (payload.db.name === 'mongoose') {
      const { totalDocs } = await payload.find({
        collection: 'relations',
        where: {
          'hasOne.title': {
            equals: 'post 1',
          },
        },
      })

      expect(totalDocs).toStrictEqual(1)
    }
  })

  it('can query using the "in" operator', async () => {
    if (payload.db.name === 'mongoose') {
      const { totalDocs } = await payload.find({
        collection: 'relations',
        where: {
          hasMany: {
            in: [posts[0].id],
          },
        },
      })

      expect(totalDocs).toStrictEqual(1)
    }
  })

  it('stores relationship values as ObjectIds not strings', async () => {
    if (payload.db.name === 'mongoose') {
      const post = await payload.create({
        collection: 'posts',
        data: { title: 'Test Post' },
      })

      const relation = await payload.create({
        collection: 'relations',
        data: { hasOne: post.id },
        depth: 0,
      })

      const doc = await payload.db.collections.relations.findOne({ _id: relation.id })

      // Should be an ObjectId, not a string
      expect(doc.hasOne instanceof mongoose.Types.ObjectId).toBe(true)
    }
  })

  it('preserves ObjectIds on updates', async () => {
    if (payload.db.name === 'mongoose') {
      const post1 = await payload.create({
        collection: 'posts',
        data: { title: 'Post 1 for update test' },
      })

      const post2 = await payload.create({
        collection: 'posts',
        data: { title: 'Post 2 for update test' },
      })

      // Create relation with post1
      const relation = await payload.create({
        collection: 'relations',
        data: { hasOne: post1.id },
        depth: 0,
      })

      // Update to point to post2
      await payload.update({
        collection: 'relations',
        id: relation.id,
        data: { hasOne: post2.id },
        depth: 0,
      })

      const doc = await payload.db.collections.relations.findOne({ _id: relation.id })

      // Should still be an ObjectId, not a string
      expect(doc.hasOne instanceof mongoose.Types.ObjectId).toBe(true)
      expect(doc.hasOne.toString()).toBe(post2.id)
    }
  })

  it('stores global relationship values as ObjectIds', async () => {
    if (payload.db.name === 'mongoose') {
      const post = await payload.create({
        collection: 'posts',
        data: { title: 'Featured Post' },
      })

      await payload.updateGlobal({
        slug: 'settings',
        data: { featuredPost: post.id },
        depth: 0,
      })

      const doc = await payload.db.globals.findOne({ globalType: 'settings' })

      // Should be an ObjectId, not a string
      expect(doc.featuredPost instanceof mongoose.Types.ObjectId).toBe(true)
      expect(doc.featuredPost.toString()).toBe(post.id)
    }
  })
})
