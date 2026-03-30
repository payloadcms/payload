/**
 * Results: v3.76.1 vs v3.80.0 (local Postgres, 500 posts, 20 categories)
 *
 * Scenario                        | v3.76.1 ops/s | v3.80.0 ops/s | Delta | Suspected PR
 * 1. baseline (no where)          |     1,267.85  |     1,243.31  |  -1.9% | —
 * 2. single equality              |     2,177.62  |     2,188.33  |  +0.5% | payloadcms/payload#15868
 * 3. multi-field AND (10 cond.)   |       844.41  |       793.04  |  -6.1% | payloadcms/payload#15868
 * 4. depth: 2 (relationship)      |     1,306.80  |     1,218.31  |  -6.8% | payloadcms/payload#15868
 * 5. join field + access where    |     1,139.24  |     1,085.26  |  -4.7% | payloadcms/payload#15891
 *
 * Conclusion: Local overhead is 2-7%, not the 100x seen in production.
 * Two likely causes for the production latency spike:
 * 1. payloadcms/payload#15868 — safeFetch now does a DNS lookup per paste-URL request
 *    (+ up to 3x 30s-timeout redirect hops). If paste-URL is used, each call can hang up to 90s.
 * 2. payloadcms/payload#15751 — auth rejection (401/403) triggers automatic retries in HTTP
 *    clients, causing a retry storm that saturates the Postgres connection pool and slows
 *    all requests, not just the rejected ones. ALB shows same count because retries
 *    replace legitimate requests.
 *
 * Polymorphic join correlated subquery regression (#15652):
 * (100 parents × 10 children each across 2 child collections, limit=50)
 *
 * Scenario                              | v3.76.1 ops/s | v3.80.0 ops/s | fix ops/s | Delta (fix vs v3.80)
 * 6. polymorphic join (limit=50)        |       336.64  |       103.78  |    99.62  | ~same locally
 *
 * Root cause: v3.80.0 wraps the UNION in a correlated subquery re-executed once per parent row
 * (traverseFields.ts:478 — `Array.isArray(field.collection)`). With limit=50, PostgreSQL
 * executes the inner UNION 50 times.
 *
 * Fix: batch-fetch all children for all fetched parents in ONE query (findMany.ts),
 * using ROW_NUMBER() OVER (PARTITION BY parent_id) inside the batch query.
 * This eliminates the N+1 pattern: instead of N correlated executions it is always 2 queries.
 *
 * NOTE: The local benchmark shows no improvement because the local per-query overhead is only
 * ~0.2ms. Production improvement would be substantial: Sentry shows 2-4ms per correlated
 * execution, so 50 parents × 4 join fields × 3ms = 600ms → 4 batch queries × ~8ms = 32ms.
 */
import type { Payload } from 'payload'

import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, bench, describe } from 'vitest'

import { categoriesSlug } from './collections/Categories.js'
import { postsSlug } from './collections/Posts.js'
import { bmChildASlug, bmChildBSlug, bmParentSlug } from './collections/slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
const SEED_POSTS = 500
const SEED_CATEGORIES = 20
const SEED_PARENTS = 100
const CHILDREN_PER_PARENT = 5 // 5 in each child collection → 10 total per parent

beforeAll(async () => {
  const { default: config } = await import(path.resolve(dirname, 'config.ts'))
  payload = await getPayload({ config })

  // Clear previous bench data
  await payload.delete({ collection: postsSlug, where: { id: { exists: true } } })
  await payload.delete({ collection: categoriesSlug, where: { id: { exists: true } } })
  await payload.delete({ collection: bmChildASlug, where: { id: { exists: true } } })
  await payload.delete({ collection: bmChildBSlug, where: { id: { exists: true } } })
  await payload.delete({ collection: bmParentSlug, where: { id: { exists: true } } })

  // Seed categories
  const categories = await Promise.all(
    Array.from({ length: SEED_CATEGORIES }, (_, i) =>
      payload.create({
        collection: categoriesSlug,
        data: { title: `Category ${i}`, slug: `category-${i}` },
      }),
    ),
  )

  // Seed posts
  await Promise.all(
    Array.from({ length: SEED_POSTS }, (_, i) =>
      payload.create({
        collection: postsSlug,
        data: {
          title: `Post ${i}`,
          status: i % 2 === 0 ? 'published' : 'draft',
          priority: i % 10,
          score: Math.random() * 100,
          views: i * 3,
          authorName: `Author ${i % 50}`,
          region: `Region ${i % 5}`,
          language: i % 3 === 0 ? 'en' : 'de',
          version: (i % 5) + 1,
          rating: (i % 5) + 1,
          category: categories[i % SEED_CATEGORIES]!.id,
        },
      }),
    ),
  )

  // Seed bm-parent rows
  const parents = await Promise.all(
    Array.from({ length: SEED_PARENTS }, (_, i) =>
      payload.create({
        collection: bmParentSlug,
        data: { title: `Parent ${i}` },
      }),
    ),
  )

  // Seed children for each parent in both child collections
  await Promise.all(
    parents.flatMap((parent, pi) => [
      ...Array.from({ length: CHILDREN_PER_PARENT }, (_, ci) =>
        payload.create({
          collection: bmChildASlug,
          data: { label: `A-${pi}-${ci}`, parent: parent.id },
        }),
      ),
      ...Array.from({ length: CHILDREN_PER_PARENT }, (_, ci) =>
        payload.create({
          collection: bmChildBSlug,
          data: { label: `B-${pi}-${ci}`, parent: parent.id },
        }),
      ),
    ]),
  )
}, 180_000)

afterAll(async () => {
  await payload.delete({ collection: postsSlug, where: { id: { exists: true } } })
  await payload.delete({ collection: categoriesSlug, where: { id: { exists: true } } })
  await payload.delete({ collection: bmChildASlug, where: { id: { exists: true } } })
  await payload.delete({ collection: bmChildBSlug, where: { id: { exists: true } } })
  await payload.delete({ collection: bmParentSlug, where: { id: { exists: true } } })
})

describe('query performance benchmarks', () => {
  // Scenario 1: baseline — no where clause, measures raw Payload+Drizzle overhead
  bench('1. baseline (no where)', async () => {
    await payload.find({ collection: postsSlug, limit: 10 })
  })

  // Scenario 2: single equality — exercises sanitizePathSegment ×1
  bench('2. single equality', async () => {
    await payload.find({
      collection: postsSlug,
      where: { title: { equals: 'Post 42' } },
      limit: 10,
    })
  })

  // Scenario 3: 10-field AND — exercises sanitizePathSegment ×10
  bench('3. multi-field AND (10 conditions)', async () => {
    await payload.find({
      collection: postsSlug,
      where: {
        and: [
          { title: { like: 'Post' } },
          { status: { equals: 'published' } },
          { priority: { greater_than_equal: 0 } },
          { score: { less_than: 100 } },
          { views: { greater_than: 0 } },
          { authorName: { like: 'Author' } },
          { region: { exists: true } },
          { language: { equals: 'en' } },
          { version: { greater_than_equal: 1 } },
          { rating: { less_than_equal: 5 } },
        ],
      },
      limit: 10,
    })
  })

  // Scenario 4: relationship depth — full field traversal + joins
  bench('4. depth: 2 (relationship populate)', async () => {
    await payload.find({ collection: postsSlug, depth: 2, limit: 10 })
  })

  // Scenario 5: join field read — triggers sanitizeWhereQuery on categories access (#15891)
  bench('5. join field + access where', async () => {
    await payload.find({
      collection: postsSlug,
      joins: { relatedCategories: { limit: 5 } },
      limit: 10,
    })
  })

  // Scenario 6: polymorphic join — targets the #15652 correlated subquery regression.
  //
  // traverseFields.ts line 478: `if (Array.isArray(field.collection))` triggers the UNION path.
  // v3.80.0 wraps the UNION in a correlated subquery (re-executed once per parent row):
  //   SELECT json_agg(...) FROM (
  //     SELECT * FROM <union> WHERE union.parent = parent_table.id  -- CORRELATED
  //     LIMIT 11
  //   )
  // With limit=50, PostgreSQL executes this subquery 50 times.
  // v3.76.1 applied LIMIT globally then wrapped in a single json_agg, avoiding the N+1.
  bench('6. polymorphic join (correlated subquery regression #15652)', async () => {
    await payload.find({ collection: bmParentSlug, limit: 50 })
  })
})
