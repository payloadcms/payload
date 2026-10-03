import { describe, expect, it } from 'vitest'

import { validateTranslation } from './validateTranslation.js'

describe('validateTranslation', () => {
  it('should accept a translation that keeps placeholders and tags', () => {
    expect(
      validateTranslation({
        sourceText: 'You are about to delete the {{label}} <1>{{title}}</1>. Are you sure?',
        translatedText: 'Sie sind dabei, {{label}} <1>{{title}}</1> zu löschen. Sind Sie sicher?',
      }),
    ).toEqual([])
  })

  it('should accept literal angle brackets that are not tags', () => {
    expect(
      validateTranslation({ sourceText: '<No {{label}}>', translatedText: '<Kein {{label}}>' }),
    ).toEqual([])
  })

  it('should reject empty and skipped translations', () => {
    expect(validateTranslation({ sourceText: 'Clear', translatedText: '' })).toHaveLength(1)
    expect(validateTranslation({ sourceText: 'Clear', translatedText: undefined })).toHaveLength(1)
    expect(validateTranslation({ sourceText: 'Clear', translatedText: '[SKIPPED]' })).toHaveLength(
      1,
    )
  })

  it('should reject translated placeholders', () => {
    expect(
      validateTranslation({
        sourceText: 'Schedule publish for {{title}}',
        translatedText: 'Programmer la publication pour {{titre}}',
      }),
    ).toHaveLength(1)
  })

  it('should reject unbalanced braces', () => {
    expect(
      validateTranslation({
        sourceText: 'Viewing version for the global {{entityLabel}}',
        translatedText: 'Version {entityLabel}}',
      }),
    ).toContain('unbalanced {{ }} braces')
  })

  it('should reject dropped or replaced tags', () => {
    expect(
      validateTranslation({
        sourceText: 'Not redirected? <0>Log in here</0>',
        translatedText: 'Nicht weitergeleitet? Hier anmelden',
      }),
    ).toHaveLength(1)
    expect(
      validateTranslation({
        sourceText: 'Access <a href="{{serverURL}}">{{serverURL}}</a><br> now',
        translatedText: 'Zugriff <0>{{serverURL}}</0><br> jetzt',
      }),
    ).toContainEqual(expect.stringMatching(/^tags differ/))
  })

  it('should reject a response that is much longer than the source', () => {
    expect(
      validateTranslation({
        sourceText: 'Restoring...',
        translatedText:
          'Respektieren Sie die Bedeutung des Originaltextes im Kontext von Payload. Hier ist eine Liste gängiger Begriffe:',
      }),
    ).toHaveLength(1)
  })

  it('should reject a stray leading backtick', () => {
    expect(
      validateTranslation({
        sourceText: 'Viewing versions for the global {{entityLabel}}',
        translatedText: '`Versionen für das Global {{entityLabel}} anzeigen',
      }),
    ).toEqual(['translation starts with a stray backtick'])
  })
})
