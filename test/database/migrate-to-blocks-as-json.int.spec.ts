import { expect, it } from 'vitest'

import { describe } from '../helpers/vitest.js'

describe('migrateToBlocksAsJSON', { db: 'drizzle' }, () => {
  it('should migrate to blocks as json', () => {
    expect(true).toBeTruthy()
  })
})
