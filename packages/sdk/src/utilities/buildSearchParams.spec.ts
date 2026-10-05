import { describe, expect, it } from 'vitest'

import { buildSearchParams } from './buildSearchParams.js'

describe('buildSearchParams', () => {
  it.each(['published', 'draft', 'latest'] as const)('should serialize version %s', (version) => {
    expect(buildSearchParams({ version })).toBe(`?version=${version}`)
  })

  it('should omit an unspecified version', () => {
    expect(buildSearchParams({})).toBe('')
  })

  it('should serialize locale all together with the selected version', () => {
    const params = new URLSearchParams(buildSearchParams({ locale: 'all', version: 'published' }))

    expect(params.get('version')).toBe('published')
    expect(params.get('locale')).toBe('all')
    expect(params.has('draft')).toBe(false)
  })
})
