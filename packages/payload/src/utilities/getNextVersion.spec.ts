import { afterEach, describe, expect, it, vi } from 'vitest'

import { getNextVersion } from './getNextVersion.js'

describe('getNextVersion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should read the version of the installed Next.js', () => {
    expect(getNextVersion()).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('should return undefined when Next.js cannot be resolved', () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/')

    expect(getNextVersion()).toBeUndefined()
  })
})
