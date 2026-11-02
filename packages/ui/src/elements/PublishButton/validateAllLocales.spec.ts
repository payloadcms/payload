import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requests } from '../../utilities/api.js'
import { validateDocumentLocales } from './validateAllLocales.js'

vi.mock('../../utilities/api.js', () => ({ requests: { post: vi.fn() } }))

beforeEach(() => {
  vi.mocked(requests.post)
    .mockReset()
    .mockImplementation(async () => Response.json({ errors: [], valid: true }))
})

describe('validateDocumentLocales', () => {
  it.each([
    { branch: 'pain', endpoint: '/api/pages/branch-only-page/validate' },
    { branch: 'campaign & review', endpoint: '/api/globals/navigation/validate' },
    { branch: undefined, endpoint: '/api/pages/main-page/validate' },
  ])(
    'should preserve branch $branch in active and sibling locale validation',
    async ({ branch, endpoint }) => {
      const data = { _status: 'published', title: 'English title', shared: 'common' }
      const result = await validateDocumentLocales({
        activeLocale: 'en',
        blocksMap: {},
        branch,
        data,
        endpoint,
        fields: [
          { name: 'title', type: 'text', localized: true },
          { name: 'shared', type: 'text' },
        ],
        locales: ['en', 'es', 'de'],
      })

      expect(result).toEqual({ errors: [], valid: true })
      expect(requests.post).toHaveBeenCalledTimes(2)

      const calls = vi.mocked(requests.post).mock.calls

      for (const [url] of calls) {
        const parsed = new URL(url, 'http://localhost')

        expect(parsed.pathname).toBe(endpoint)
        expect(parsed.searchParams.get('branch')).toBe(branch ?? null)
      }

      expect(new URL(calls[0][0], 'http://localhost').searchParams.getAll('locale')).toEqual(['en'])
      expect(new URL(calls[1][0], 'http://localhost').searchParams.getAll('locale')).toEqual([
        'es',
        'de',
      ])
      expect(JSON.parse(calls[0][1].body as string)).toEqual(data)
      expect(JSON.parse(calls[1][1].body as string)).toEqual({
        _status: 'published',
        shared: 'common',
      })
      expect(data.title).toBe('English title')
    },
  )
})
