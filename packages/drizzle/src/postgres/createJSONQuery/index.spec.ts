import { jsonb, pgTable, serial } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'

import { createJSONQuery } from './index.js'

const postsTable = pgTable('posts', {
  id: serial('id').primaryKey(),
  data: jsonb('data'),
})

describe('createJSONQuery', () => {
  it('should qualify the column with its table name', () => {
    const query = createJSONQuery({
      column: postsTable.data,
      operator: 'exists',
      pathSegments: ['data', 'publishedAt'],
      value: true,
    })

    expect(query).toBe(`jsonb_path_exists("posts"."data", '$.publishedAt[*]')`)
  })
})
