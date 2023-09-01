import type React from 'react'

import { loader } from '@monaco-editor/react'
import deepmerge from 'deepmerge'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import { defaultOptions } from '../../../../translations/defaultOptions'
import { getSupportedMonacoLocale } from '../../../utilities/getSupportedMonacoLocale'
import { useConfig } from '../Config'

export const I18n: React.FC = () => {
  const config = useConfig()

  if (i18n.isInitialized) {
    return null
  }

  i18n
    .use(
      new LanguageDetector(null, {
        lookupCookie: 'lng',
        lookupLocalStorage: 'lng',
      }),
    )
    .use(initReactI18next)
    .init(deepmerge(defaultOptions, config.i18n || {}))
  loader.config({
    'vs/nls': { availableLanguages: { '*': getSupportedMonacoLocale(i18n.language) } },
  })
  return null
}

export default I18n
