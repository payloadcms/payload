import { describe, expect, it } from 'vitest'

import { makePostgresDropsIdempotent } from './makePostgresDropsIdempotent.js'

describe('makePostgresDropsIdempotent', () => {
  it('rewrites DROP CONSTRAINT to DROP CONSTRAINT IF EXISTS', () => {
    const input = ['ALTER TABLE "posts_rels" DROP CONSTRAINT "posts_rels_posts_fk";']
    expect(makePostgresDropsIdempotent(input)).toEqual([
      'ALTER TABLE "posts_rels" DROP CONSTRAINT IF EXISTS "posts_rels_posts_fk";',
    ])
  })

  it('rewrites DROP INDEX to DROP INDEX IF EXISTS', () => {
    const input = ['DROP INDEX "posts_title_idx";']
    expect(makePostgresDropsIdempotent(input)).toEqual(['DROP INDEX IF EXISTS "posts_title_idx";'])
  })

  it('does not double-rewrite statements that already use IF EXISTS', () => {
    const input = [
      'ALTER TABLE "posts_rels" DROP CONSTRAINT IF EXISTS "posts_rels_posts_fk";',
      'DROP INDEX IF EXISTS "posts_title_idx";',
    ]
    expect(makePostgresDropsIdempotent(input)).toEqual(input)
  })

  it('leaves CREATE INDEX and other DDL untouched', () => {
    const input = [
      'CREATE INDEX IF NOT EXISTS "posts_title_idx" ON "posts" USING btree ("title");',
      'DROP TABLE "posts_rels" CASCADE;',
      'ALTER TABLE "posts" ADD COLUMN "slug" varchar;',
    ]
    expect(makePostgresDropsIdempotent(input)).toEqual(input)
  })

  it('handles multiple drops in a single statement', () => {
    const input = [
      'ALTER TABLE "posts_rels" DROP CONSTRAINT "posts_rels_posts_fk", DROP CONSTRAINT "posts_rels_categories_fk";',
    ]
    expect(makePostgresDropsIdempotent(input)).toEqual([
      'ALTER TABLE "posts_rels" DROP CONSTRAINT IF EXISTS "posts_rels_posts_fk", DROP CONSTRAINT IF EXISTS "posts_rels_categories_fk";',
    ])
  })
})
