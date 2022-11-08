import i18next from 'i18next';
import type { InitOptions } from 'i18next';
import i18nHTTPMiddleware from 'i18next-http-middleware';
import deepmerge from 'deepmerge';
import { defaultOptions } from '../../translations/defaultOptions';

export default function i18nMiddleware(i18n: InitOptions) {
  i18next.use(i18nHTTPMiddleware.LanguageDetector)
    .init({
      preload: Object.keys(defaultOptions.supportedLngs),
      ...deepmerge(defaultOptions, i18n || {}),
    });

  return i18nHTTPMiddleware.handle(i18next, {});
}
