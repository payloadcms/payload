import React from 'react';
import Editor, { loader } from '@monaco-editor/react';

import './index.scss';

// how to load monaco editor as an npm package
// https://github.com/suren-atoyan/monaco-react#use-monaco-editor-as-an-npm-package
import * as monaco from 'monaco-editor';
// eslint-disable-next-line
// @ts-ignore
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'; // eslint-disable-line
// eslint-disable-next-line
// @ts-ignore
import JSONWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'; // eslint-disable-line
// eslint-disable-next-line
// @ts-ignore
import CSSWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'; // eslint-disable-line
// eslint-disable-next-line
// @ts-ignore
import HTMLWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'; // eslint-disable-line
// eslint-disable-next-line
// @ts-ignore
import TSWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'; // eslint-disable-line


import { useTranslation } from 'react-i18next';
import { useTheme } from '../../utilities/Theme';
import { ShimmerEffect } from '../ShimmerEffect';
import type { Props } from './types';
import { getSupportedMonacoLocale } from '../../../utilities/getSupportedMonacoLocale';

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

const baseClass = 'code-editor';

const CodeEditor: React.FC<Props> = (props) => {
  const { readOnly, className, options, height, ...rest } = props;

  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const [loadedEditorWithConfig, setLoadedEditorWithConfig] = React.useState(false);

  React.useEffect(() => {
    loader.config({
      monaco,
      'vs/nls': {
        availableLanguages: {
          '*': getSupportedMonacoLocale(i18n.language),
        },
      },
    });
    loader.init().then(() => {
      setLoadedEditorWithConfig(true);
    });
  }, [i18n.language]);

  const classes = [
    baseClass,
    className,
    rest?.defaultLanguage ? `language--${rest.defaultLanguage}` : '',
  ].filter(Boolean).join(' ');

  if (!loadedEditorWithConfig) return null;

  return (
    <Editor
      className={classes}
      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
      loading={<ShimmerEffect height={height} />}
      options={
        {
          detectIndentation: true,
          minimap: {
            enabled: false,
          },
          readOnly: Boolean(readOnly),
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: 'on',
          ...options,
        }
      }
      height={height}
      {...rest}
    />
  );
};

export default CodeEditor;
