import { describe, expect, it } from 'vitest'

import { buildSearchParams } from './buildSearchParams.js'

describe('buildSearchParams', () => {
  it('should serialize version as an exact query string', () => {
    expect(buildSearchParams({ version: 'latest' })).toBe('?version=latest')
    expect(buildSearchParams({ version: 'draft' })).toBe('?version=draft')
    expect(buildSearchParams({ version: 'published' })).toBe('?version=published')
  })

  it('should serialize action as an exact query string', () => {
    expect(buildSearchParams({ action: 'saveDraft' })).toBe('?action=saveDraft')
    expect(buildSearchParams({ action: 'publish' })).toBe('?action=publish')
    expect(buildSearchParams({ action: 'unpublish' })).toBe('?action=unpublish')
  })

  it('should not serialize boolean draft or coerce booleans onto version and action', () => {
    expect(buildSearchParams({ draft: true } as never)).toBe('')
    expect(buildSearchParams({ version: true as never })).toBe('')
    expect(buildSearchParams({ action: false as never })).toBe('')
  })
})
