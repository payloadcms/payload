import i18next from 'i18next';
import type { InitOptions } from 'i18next';
import deepmerge from 'deepmerge';
import { defaultOptions } from './defaultOptions';

export default (options: InitOptions) => {
  i18next.init({
    ...deepmerge(defaultOptions, options || {}),
  });
  return i18next;
};
