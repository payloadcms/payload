import { updateOne, upsert } from '@payloadcms/drizzle'
import { describe, expect, it } from 'vitest'

import { sqliteD1Adapter } from './index.js'

describe('sqliteD1Adapter', () => {
  it('registers the drizzle upsert operation rather than updateOne', () => {
    const adapter = sqliteD1Adapter({ binding: {} as never }).init({
      payload: { config: { collections: [], globals: [] } } as never,
    })

    expect(adapter.upsert).toBe(upsert)
    expect(adapter.upsert).not.toBe(updateOne)
  })
})
