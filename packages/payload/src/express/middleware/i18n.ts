import i18next from 'i18next';
import type { InitOptions } from 'i18next';
import i18nHTTPMiddleware from 'i18next-http-middleware';
import deepmerge from 'deepmerge';
import { Handler } from 'express';
import { defaultOptions } from '../../translations/defaultOptions';

const i18nMiddleware = (options: InitOptions): Handler => {
  i18next.use(i18nHTTPMiddleware.LanguageDetector)
    .init({
      preload: defaultOptions.supportedLngs,
      ...deepmerge(defaultOptions, options || {}),
    });

  return i18nHTTPMiddleware.handle(i18next);
};

export { i18nMiddleware };
