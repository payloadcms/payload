import { initI18n } from '@payloadcms/translations'
import { de } from '@payloadcms/translations/languages/de'
import { describe, expect, it } from 'vitest'

import { ValidationError } from './ValidationError.js'

describe('ValidationError', () => {
  it('should translate the message with req.t when no t is passed', async () => {
    const i18n = await initI18n({
      config: { fallbackLanguage: 'de', supportedLanguages: { de } },
      context: 'api',
      language: 'de',
    })

    const error = new ValidationError({
      errors: [{ message: 'Invalides Passwort', path: 'password' }],
      req: { i18n, t: i18n.t },
    })

    expect(error.message).toBe('Das folgende Feld ist nicht korrekt: password')
  })
})
