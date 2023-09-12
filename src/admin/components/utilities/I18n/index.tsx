import React from 'react';
import i18n from 'i18next';
import { loader } from '@monaco-editor/react';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import deepmerge from 'deepmerge';

// how to load monaco editor as an npm package
// https://github.com/suren-atoyan/monaco-react#use-monaco-editor-as-an-npm-package
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js'; // eslint-disable-line
import JSONWorker from 'monaco-editor/esm/vs/language/json/json.worker.js'; // eslint-disable-line
import CSSWorker from 'monaco-editor/esm/vs/language/css/css.worker.js'; // eslint-disable-line
import HTMLWorker from 'monaco-editor/esm/vs/language/html/html.worker.js'; // eslint-disable-line
import TSWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker.js'; // eslint-disable-line
import { useConfig } from '../Config';
import { defaultOptions } from '../../../../translations/defaultOptions';

// eslint-disable-next-line
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new JSONWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new CSSWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new HTMLWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new TSWorker();
    }
    return new EditorWorker();
  },
};

export const I18n: React.FC = () => {
  const config = useConfig();

  if (i18n.isInitialized) {
    return null;
  }

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init(deepmerge(defaultOptions, config.i18n || {}));
  loader.config({ monaco });
  return null;
};
