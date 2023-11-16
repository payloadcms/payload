import type { InitOptions, i18n } from 'i18next'

import deepmerge from 'deepmerge'
import i18next from 'i18next'

import { defaultOptions } from './defaultOptions'

export function i18nInit(options: InitOptions): i18n {
  if (i18next.isInitialized) {
    return i18next
  }
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  i18next.init({
    ...deepmerge(defaultOptions, options || {}),
  })
  return i18next
}
