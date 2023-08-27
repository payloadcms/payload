import i18next from 'i18next';
import type { i18n, InitOptions } from 'i18next';
import deepmerge from 'deepmerge';
import { defaultOptions } from './defaultOptions.js';

const i18nextreal: i18n = i18next as unknown as i18n;

export function i18nInit(options: InitOptions): i18n {
  if (i18nextreal.isInitialized) {
    return i18nextreal;
  }
  i18nextreal.init({
    ...deepmerge(defaultOptions, options || {}),
  });
  return i18nextreal;
}
