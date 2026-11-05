import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getRequestLocale } from './getRequestLocale.js'

const mocks = vi.hoisted(() => ({ getPreferences: vi.fn(), upsertPreferences: vi.fn() }))

vi.mock('@payloadcms/ui/rsc', () => ({ upsertPreferences: mocks.upsertPreferences }))
vi.mock('@payloadcms/ui/shared', () => ({
  findLocaleFromCode: (config: { locales: { code: string }[] }, code: string) =>
    config.locales.find((locale) => locale.code === code),
}))
vi.mock('./getPreferences.js', () => ({ getPreferences: mocks.getPreferences }))

const req = () =>
  ({
    locale: 'es',
    payload: {
      config: { localization: { defaultLocale: 'en', locales: [{ code: 'en' }, { code: 'es' }] } },
    },
    query: {},
    user: { id: 'user', collection: 'users' },
  }) as unknown as PayloadRequest

describe('getRequestLocale', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPreferences.mockResolvedValue({ value: 'es' })
  })

  it('should use the explicit operation locale without reading or writing preferences', async () => {
    expect(await getRequestLocale({ locale: 'en', req: req() })).toEqual({ code: 'en' })
    expect(mocks.getPreferences).not.toHaveBeenCalled()
    expect(mocks.upsertPreferences).not.toHaveBeenCalled()
  })

  it('should reject unknown explicit locales', async () => {
    await expect(getRequestLocale({ locale: 'unknown', req: req() })).rejects.toThrow(
      'Invalid locale',
    )
    expect(mocks.upsertPreferences).not.toHaveBeenCalled()
  })

  it('should preserve preference fallback when no operation locale is supplied', async () => {
    expect(await getRequestLocale({ req: req() })).toEqual({ code: 'es' })
    expect(mocks.getPreferences).toHaveBeenCalledOnce()
  })
})
