import React from 'react';
import i18n from 'i18next';
import { loader } from '@monaco-editor/react';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import deepmerge from 'deepmerge';
import { defaultOptions } from '../../../../translations/defaultOptions';
import { useConfig } from '../Config';
import { getSupportedMonacoLocale } from '../../../utilities/getSupportedMonacoLocale';

export const I18n: React.FC = () => {
  const config = useConfig();

  if (i18n.isInitialized) {
    return null;
  }

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init(deepmerge(defaultOptions, config.i18n || {}));
  loader.config({ 'vs/nls': { availableLanguages: { '*': getSupportedMonacoLocale(i18n.language) } } });
  return null;
};

export default I18n;
