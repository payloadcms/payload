import type { DrizzleAdapter } from '../types.js'

import { createClient } from '@libsql/client'
import { defineRelations, defineRelationsPart } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { describe, expect, it } from 'vitest'

import { executeSchemaHooks } from '../utilities/executeSchemaHooks.js'
import { addMissingTablesToRelations, mergeDrizzleRelations } from './buildDrizzleRelations.js'

const posts = sqliteTable('posts', { id: integer().primaryKey(), title: text() })
const comments = sqliteTable('comments', { id: integer().primaryKey(), post: integer() })

describe('drizzle relations from schema hooks', () => {
  it('should add relations from a hook to a table without dropping its existing relations', async () => {
    const payloadRelations = defineRelations({ posts, comments }, (r) => ({
      comments: { postRel: r.one.posts({ from: r.comments.post, to: r.posts.id }) },
    }))
    const hookRelations = defineRelationsPart({ posts, comments }, (r) => ({
      posts: { comments: r.many.comments({ from: r.posts.id, to: r.comments.post }) },
      comments: { postAlias: r.one.posts({ from: r.comments.post, to: r.posts.id }) },
    }))

    const relations = mergeDrizzleRelations({
      base: payloadRelations as DrizzleAdapter['relations'],
      extra: hookRelations as DrizzleAdapter['relations'],
    })

    expect(Object.keys(relations.comments.relations).sort()).toEqual(['postAlias', 'postRel'])

    const client = createClient({ url: 'file::memory:' })

    try {
      const db = drizzle({ client, relations })

      await client.execute('CREATE TABLE posts (id integer PRIMARY KEY, title text)')
      await client.execute('CREATE TABLE comments (id integer PRIMARY KEY, post integer)')
      await client.execute("INSERT INTO posts VALUES (1, 'Hello')")
      await client.execute('INSERT INTO comments VALUES (1, 1)')

      const result = await db.query.posts.findFirst({ with: { comments: true } })

      expect(result).toEqual({ id: 1, comments: [{ id: 1, post: 1 }], title: 'Hello' })
    } finally {
      client.close()
    }
  })

  it('should make tables added after relations are built available on db.query', () => {
    const adapter = {
      relations: defineRelations({ posts }),
      tables: { comments, posts },
    } as unknown as DrizzleAdapter

    addMissingTablesToRelations({ adapter })

    expect(Object.keys(adapter.relations).sort()).toEqual(['comments', 'posts'])
    expect(adapter.relations.comments.table).toBe(comments)
  })

  it('should reject relations created with the pre-1.0 relations() helper', async () => {
    const adapter = {
      afterSchemaInit: [
        ({ schema }) => ({
          ...schema,
          relations: { ...schema.relations, relations_posts: { config: () => ({}), table: posts } },
        }),
      ],
      beforeSchemaInit: [],
      relations: {},
      tables: { posts },
    }

    await expect(executeSchemaHooks({ type: 'afterSchemaInit', adapter })).rejects.toThrow(
      'relations["relations_posts"], which is not a Drizzle 1.0 relations config',
    )
  })
})
