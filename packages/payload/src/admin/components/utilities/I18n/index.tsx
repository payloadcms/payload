import React from 'react';
import i18nextimp from 'i18next';
// Needed for esm/cjs compatibility
const i18n = 'default' in i18nextimp ? i18nextimp.default : i18nextimp;

import { loader } from '@monaco-editor/react';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import deepmerge from 'deepmerge';
import { defaultOptions } from '../../../../translations/defaultOptions.js';
import { useConfig } from '../Config/index.js';
import { getSupportedMonacoLocale } from '../../../utilities/getSupportedMonacoLocale.js';

export const I18n: React.FC = () => {
  const config = useConfig();
  // @ts-ignore // TODO: Fix
  if (i18n.isInitialized) {
    return null;
  }

  
  i18n
  // @ts-ignore // TODO: Fix
    .use(new LanguageDetector(null, {
      lookupCookie: 'lng',
      lookupLocalStorage: 'lng',
    }))
    .use(initReactI18next)
    .init(deepmerge(defaultOptions, config.i18n || {}));
      // @ts-ignore // TODO: Fix
  loader.config({ 'vs/nls': { availableLanguages: { '*': getSupportedMonacoLocale(i18n.language) } } });
  return null;
};

export default I18n;
