import i18next from 'i18next';
import type { i18n, InitOptions } from 'i18next';
import deepmerge from 'deepmerge';
import { defaultOptions } from './defaultOptions';

export default (options: InitOptions): i18n => {
  if (i18next.isInitialized) {
    return i18next;
  }
  i18next.init({
    ...deepmerge(defaultOptions, options || {}),
  });
  return i18next;
};
