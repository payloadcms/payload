import { t } from '@payloadcms/translations'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'
import { fa } from '@payloadcms/translations/languages/fa'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

const state = vi.hoisted((): { language: 'en' | 'es' | 'fa' } => ({ language: 'en' }))

vi.mock('../../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    t: (key: 'general:noLabel', vars: { label: string }) =>
      t({ key, translations: { en, es, fa }[state.language].translations, vars }),
  }),
}))

import { EmptyCell } from './index.js'

describe('EmptyCell', () => {
  it.each([
    { expected: 'No Title', label: 'Title', language: 'en' },
    { expected: 'Sin Título', label: 'Título', language: 'es' },
    { expected: 'بدون عنوان', label: 'عنوان', language: 'fa' },
  ] as const)(
    'should preserve field-specific wording in $language without outer brackets',
    (args) => {
      state.language = args.language

      const markup = renderToStaticMarkup(React.createElement(EmptyCell, { label: args.label }))

      expect(markup).toContain('<span aria-hidden="true">—</span>')
      expect(markup).toContain(`<span class="sr-only">${args.expected}</span>`)
    },
  )

  it('should preserve brackets that belong to the field label', () => {
    state.language = 'en'

    const markup = renderToStaticMarkup(React.createElement(EmptyCell, { label: '<Title>' }))

    expect(markup).toContain('<span class="sr-only">No &lt;Title&gt;</span>')
  })
})
