import type { Handler } from 'express'
import type { InitOptions } from 'i18next'

import deepmerge from 'deepmerge'
import i18next from 'i18next'
import i18nHTTPMiddleware from 'i18next-http-middleware'

import { defaultOptions } from '../../translations/defaultOptions'

const i18nMiddleware = (options: InitOptions): Handler => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  i18next.use(new i18nHTTPMiddleware.LanguageDetector(defaultOptions.detection)).init({
    preload: defaultOptions.supportedLngs,
    ...deepmerge(defaultOptions, options || {}),
  })

  return i18nHTTPMiddleware.handle(i18next)
}

export { i18nMiddleware }
