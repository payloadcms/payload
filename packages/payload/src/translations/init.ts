import i18nextimp from 'i18next'
// Needed for esm/cjs compatibility
const i18next = 'default' in i18nextimp ? i18nextimp.default : i18nextimp

import type { InitOptions, i18n } from 'i18next'

import deepmerge from 'deepmerge'

import { defaultOptions } from './defaultOptions.js'

export function i18nInit(options: InitOptions): i18n {
  if (i18next.isInitialized) {
    return i18next
  }
  i18next.init({
    ...deepmerge(defaultOptions, options || {}),
  })
  return i18next
}
