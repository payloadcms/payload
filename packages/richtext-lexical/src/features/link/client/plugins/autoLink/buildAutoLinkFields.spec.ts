import { describe, expect, it } from 'vitest'

import { buildAutoLinkFields } from './buildAutoLinkFields.js'

describe('buildAutoLinkFields', () => {
  it('should merge static autolink fields into persisted link fields', () => {
    const fields = buildAutoLinkFields({
      staticFields: {
        newTab: true,
        someText: 'static-value',
      },
      url: 'https://example.com',
    })

    expect(fields).toMatchObject({
      linkType: 'custom',
      newTab: true,
      someText: 'static-value',
      url: 'https://example.com',
    })
  })
})
