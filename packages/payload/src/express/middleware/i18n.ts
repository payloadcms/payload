import i18nextimp from 'i18next';
// Needed for esm/cjs compatibility
const i18next = 'default' in i18nextimp ? i18nextimp.default : i18nextimp;

import type { Handler } from 'express';
import type { InitOptions } from 'i18next';

import deepmerge from 'deepmerge';
import { LanguageDetector, handle } from 'i18next-http-middleware';

import { defaultOptions } from '../../translations/defaultOptions.js';

const i18nMiddleware = (options: InitOptions): Handler => {
  i18next.use(new LanguageDetector(defaultOptions.detection)).init({
    preload: defaultOptions.supportedLngs,
    ...deepmerge(defaultOptions, options || {}),
  });

  return handle(i18next);
};

export { i18nMiddleware };
