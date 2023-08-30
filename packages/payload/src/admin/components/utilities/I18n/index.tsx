import type React from 'react'

import i18nextimp from 'i18next'
// Needed for esm/cjs compatibility
const i18n = 'default' in i18nextimp ? i18nextimp.default : i18nextimp

import { loader } from '@monaco-editor/react'
import deepmerge from 'deepmerge'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import { defaultOptions } from '../../../../translations/defaultOptions.js'
import { getSupportedMonacoLocale } from '../../../utilities/getSupportedMonacoLocale.js'
import { useConfig } from '../Config/index.js'

export const I18n: React.FC = () => {
  const config = useConfig()
  // @ts-expect-error // TODO: Fix
  if (i18n.isInitialized) {
    return null
  }

  i18n
    // @ts-expect-error // TODO: Fix
    .use(
      new LanguageDetector(null, {
        lookupCookie: 'lng',
        lookupLocalStorage: 'lng',
      }),
    )
    .use(initReactI18next)
    .init(deepmerge(defaultOptions, config.i18n || {}))
  // @ts-expect-error // TODO: Fix
  loader.config({
    'vs/nls': { availableLanguages: { '*': getSupportedMonacoLocale(i18n.language) } },
  })
  return null
}

export default I18n
