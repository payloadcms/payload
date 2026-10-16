import { describe, expect, it } from 'vitest'

import { generateURL } from './generateURL.js'

describe('Azure storage adapter', () => {
  it('should generate the pre-upgrade public URL for a legacy upload', () => {
    expect(
      generateURL({
        baseURL: 'https://storage.example.test',
        collectionPrefix: 'docprefix-collection',
        containerName: 'uploads',
        filename: 'legacy.png',
        prefix: 'legacy-invoices',
      }),
    ).toBe('https://storage.example.test/uploads/legacy-invoices/legacy.png')
  })
})
