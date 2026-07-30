import type { PayloadRequest, SanitizedLocalizationConfig } from '../index.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getRequestLocale } from './getRequestLocale.js'

const { findPreference, updatePreference } = vi.hoisted(() => ({
  findPreference: vi.fn(),
  updatePreference: vi.fn(),
}))

vi.mock('../preferences/operations/findOne.js', () => ({
  findOne: findPreference,
}))

vi.mock('../preferences/operations/update.js', () => ({
  update: updatePreference,
}))

const localization = {
  defaultLocale: 'en',
  locales: [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
  ],
} as SanitizedLocalizationConfig

const createRequest = ({
  isLocalized = true,
  locale,
  user = true,
}: {
  isLocalized?: boolean
  locale?: string
  user?: boolean
} = {}): PayloadRequest =>
  ({
    payload: {
      config: {
        localization: isLocalized ? localization : false,
      },
    },
    query: locale ? { locale } : {},
    user: user
      ? {
          collection: 'users',
          id: 'user-id',
        }
      : null,
  }) as PayloadRequest

describe('getRequestLocale', () => {
  beforeEach(() => {
    findPreference.mockReset()
    updatePreference.mockReset()
  })

  it('should persist and return a valid locale from the request query', async () => {
    const req = createRequest({ locale: 'es' })

    await expect(getRequestLocale({ req })).resolves.toMatchObject({ code: 'es' })
    expect(updatePreference).toHaveBeenCalledWith({
      key: 'locale',
      req,
      user: req.user,
      value: 'es',
    })
    expect(findPreference).not.toHaveBeenCalled()
  })

  it('should return a valid stored locale when the request query omits locale', async () => {
    const req = createRequest()
    findPreference.mockResolvedValue({ value: 'es' })

    await expect(getRequestLocale({ req })).resolves.toMatchObject({ code: 'es' })
    expect(findPreference).toHaveBeenCalledWith({
      key: 'locale',
      req,
      user: req.user,
    })
  })

  it('should fall back to the configured default locale', async () => {
    findPreference.mockResolvedValue(null)

    await expect(getRequestLocale({ req: createRequest() })).resolves.toMatchObject({ code: 'en' })
  })

  it('should return undefined when localization is disabled', async () => {
    await expect(
      getRequestLocale({ req: createRequest({ isLocalized: false }) }),
    ).resolves.toBeUndefined()
    expect(findPreference).not.toHaveBeenCalled()
    expect(updatePreference).not.toHaveBeenCalled()
  })
})
