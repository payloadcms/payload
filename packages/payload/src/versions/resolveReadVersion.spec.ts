import { describe, expect, it } from 'vitest'

import { APIError } from '../errors/APIError.js'
import { resolveReadVersion } from './resolveReadVersion.js'

describe('resolveReadVersion', () => {
  it('should default omission to published', () => {
    expect(resolveReadVersion({ draftsEnabled: true })).toBe('published')
    expect(resolveReadVersion({ draftsEnabled: false })).toBe('published')
    expect(resolveReadVersion({ draftsEnabled: true, version: null })).toBe('published')
  })

  it('should preserve published, latest, and draft on draft-enabled entities', () => {
    expect(resolveReadVersion({ draftsEnabled: true, version: 'published' })).toBe('published')
    expect(resolveReadVersion({ draftsEnabled: true, version: 'latest' })).toBe('latest')
    expect(resolveReadVersion({ draftsEnabled: true, version: 'draft' })).toBe('draft')
  })

  it('should map latest to published on entities without drafts', () => {
    expect(resolveReadVersion({ draftsEnabled: false, version: 'latest' })).toBe('published')
    expect(resolveReadVersion({ draftsEnabled: false, version: 'published' })).toBe('published')
  })

  it('should keep draft as draft-only even on entities without drafts', () => {
    expect(resolveReadVersion({ draftsEnabled: false, version: 'draft' })).toBe('draft')
  })

  it('should reject invalid runtime strings', () => {
    expect(() => resolveReadVersion({ draftsEnabled: true, version: 'Published' })).toThrow(
      APIError,
    )
    expect(() => resolveReadVersion({ draftsEnabled: true, version: 'Published' })).toThrow(
      'Invalid version "Published". Valid values are: published, latest, draft.',
    )
  })

  it('should reject leftover boolean draft intent', () => {
    expect(() => resolveReadVersion({ draftsEnabled: true, version: true })).toThrow(
      'Invalid version true. Valid values are: published, latest, draft.',
    )
  })
})
