import i18next from 'i18next';
import type { InitOptions, i18n } from 'i18next';
import { LanguageDetector, handle } from 'i18next-http-middleware';
import deepmerge from 'deepmerge';
import { Handler } from 'express';
import { defaultOptions } from '../../translations/defaultOptions.js';

const i18nMiddleware = (options: InitOptions): Handler => {
  i18next.use(new LanguageDetector(defaultOptions.detection))
    .init({
      preload: defaultOptions.supportedLngs,
      ...deepmerge(defaultOptions, options || {}),
    });

  return handle(i18next as unknown as i18n);
};

export { i18nMiddleware };
