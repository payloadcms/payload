import React from 'react';
import i18n, { InitOptions } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import deepmerge from 'deepmerge';
import translations from '../../../../translations';
import { useConfig } from '../Config';

const defaultOptions: InitOptions = {
  fallbackLng: 'en',
  debug: false,
  supportedLngs: Object.keys(translations),
  resources: translations,
};

export const I18n: React.FC = () => {
  const config = useConfig();
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init(deepmerge(defaultOptions, config.i18n || {}));

  return null;
};

export default I18n;
