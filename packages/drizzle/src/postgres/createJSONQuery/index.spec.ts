import { jsonb, pgTable, text } from 'drizzle-orm/pg-core'
import { APIError } from 'payload'
import { describe, expect, it } from 'vitest'

import { createJSONQuery } from './index.js'

describe('createJSONQuery (postgres)', () => {
  const postsTable = pgTable('posts', {
    id: text('id').primaryKey(),
    data: jsonb('data'),
  })

  describe('column identifier qualification', () => {
    it('qualifies column with table name when Drizzle column object is passed', () => {
      const result = createJSONQuery({
        column: postsTable.data,
        operator: 'equals',
        pathSegments: ['data', 'title'],
        value: 'Hello',
      })

      expect(result).toBe('jsonb_path_exists("posts"."data", \'$.title[*] ? (@ == "Hello")\')')
    })

    it('quotes column name when object without table is passed', () => {
      const mockColumn = { name: 'raw_json' } as any
      const result = createJSONQuery({
        column: mockColumn,
        operator: 'equals',
        pathSegments: ['raw_json', 'key'],
        value: 'val',
      })

      expect(result).toBe('jsonb_path_exists("raw_json", \'$.key[*] ? (@ == "val")\')')
    })

    it('preserves raw string column expression when string is passed', () => {
      const result = createJSONQuery({
        column: 'subquery.custom_col',
        operator: 'equals',
        pathSegments: ['custom_col', 'status'],
        value: 'active',
      })

      expect(result).toBe(
        'jsonb_path_exists(subquery.custom_col, \'$.status[*] ? (@ == "active")\')',
      )
    })
  })

  describe('comparison and range operators', () => {
    it('supports less_than with numbers', () => {
      const result = createJSONQuery({
        column: postsTable.data,
        operator: 'less_than',
        pathSegments: ['data', 'viewCount'],
        value: 100,
      })

      expect(result).toBe('jsonb_path_exists("posts"."data", \'$.viewCount[*] ? (@ < 100)\')')
    })

    it('supports less_than_equal with ISO timestamp strings', () => {
      const result = createJSONQuery({
        column: postsTable.data,
        operator: 'less_than_equal',
        pathSegments: ['data', 'publishedAt'],
        value: '2026-10-26T00:10:00.000Z',
      })

      expect(result).toBe(
        'jsonb_path_exists("posts"."data", \'$.publishedAt[*] ? (@ <= "2026-10-26T00:10:00.000Z")\')',
      )
    })

    it('supports greater_than with numbers', () => {
      const result = createJSONQuery({
        column: postsTable.data,
        operator: 'greater_than',
        pathSegments: ['data', 'price'],
        value: 49.99,
      })

      expect(result).toBe('jsonb_path_exists("posts"."data", \'$.price[*] ? (@ > 49.99)\')')
    })

    it('supports greater_than_equal with ISO timestamp strings', () => {
      const result = createJSONQuery({
        column: postsTable.data,
        operator: 'greater_than_equal',
        pathSegments: ['data', 'createdAt'],
        value: '2026-01-01T00:00:00.000Z',
      })

      expect(result).toBe(
        'jsonb_path_exists("posts"."data", \'$.createdAt[*] ? (@ >= "2026-01-01T00:00:00.000Z")\')',
      )
    })
  })

  describe('existing operators compatibility', () => {
    it('supports equals and not_equals', () => {
      const eqResult = createJSONQuery({
        column: postsTable.data,
        operator: 'equals',
        pathSegments: ['data', 'author'],
        value: 'Alice',
      })
      expect(eqResult).toBe('jsonb_path_exists("posts"."data", \'$.author[*] ? (@ == "Alice")\')')

      const neqResult = createJSONQuery({
        column: postsTable.data,
        operator: 'not_equals',
        pathSegments: ['data', 'author'],
        value: 'Bob',
      })
      expect(neqResult).toBe('jsonb_path_exists("posts"."data", \'$.author[*] ? (@ != "Bob")\')')
    })

    it('supports exists with true and false', () => {
      const existsTrue = createJSONQuery({
        column: postsTable.data,
        operator: 'exists',
        pathSegments: ['data', 'meta', 'tags'],
        value: true,
      })
      expect(existsTrue).toBe('jsonb_path_exists("posts"."data", \'$.meta[*].tags[*]\')')

      const existsFalse = createJSONQuery({
        column: postsTable.data,
        operator: 'exists',
        pathSegments: ['data', 'meta', 'tags'],
        value: false,
      })
      expect(existsFalse).toBe('NOT jsonb_path_exists("posts"."data", \'$.meta[*].tags[*]\')')
    })

    it('supports in and not_in with array values', () => {
      const inResult = createJSONQuery({
        column: postsTable.data,
        operator: 'in',
        pathSegments: ['data', 'status'],
        value: ['draft', 'published'],
      })
      expect(inResult).toBe(
        '(jsonb_path_exists("posts"."data", \'$.status[*] ? (@ == "draft")\') OR jsonb_path_exists("posts"."data", \'$.status[*] ? (@ == "published")\'))',
      )

      const notInResult = createJSONQuery({
        column: postsTable.data,
        operator: 'not_in',
        pathSegments: ['data', 'status'],
        value: ['archived', 'deleted'],
      })
      expect(notInResult).toBe(
        '(jsonb_path_exists("posts"."data", \'$.status[*] ? (@ != "archived")\') AND jsonb_path_exists("posts"."data", \'$.status[*] ? (@ != "deleted")\'))',
      )
    })

    it('supports contains, like, and not_like', () => {
      const containsResult = createJSONQuery({
        column: postsTable.data,
        operator: 'contains',
        pathSegments: ['data', 'description'],
        value: 'featured',
      })
      expect(containsResult).toBe(
        'jsonb_path_exists("posts"."data", \'$.description[*] ? (@ ~ "featured")\')',
      )

      const likeResult = createJSONQuery({
        column: postsTable.data,
        operator: 'like',
        pathSegments: ['data', 'title'],
        value: 'test',
      })
      expect(likeResult).toBe(
        'jsonb_path_exists("posts"."data", \'$.title[*] ? (@ like_regex "(?i)test")\')',
      )

      const notLikeResult = createJSONQuery({
        column: postsTable.data,
        operator: 'not_like',
        pathSegments: ['data', 'title'],
        value: 'secret',
      })
      expect(notLikeResult).toBe(
        'NOT jsonb_path_exists("posts"."data", \'$.title[*] ? (@ like_regex "(?i)secret")\')',
      )
    })
  })

  describe('defensive validation and error handling', () => {
    it('throws APIError when an unsupported operator is passed', () => {
      expect(() =>
        createJSONQuery({
          column: postsTable.data,
          operator: 'unsupported_operator',
          pathSegments: ['data', 'tag'],
          value: 'test',
        }),
      ).toThrow(APIError)
    })
  })
})
