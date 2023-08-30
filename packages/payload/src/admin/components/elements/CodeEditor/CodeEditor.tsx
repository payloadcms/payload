import Editor from '@monaco-editor/react';
import React from 'react';

import type { Props } from './types.js';

import { useTheme } from '../../utilities/Theme/index.js';
import { ShimmerEffect } from '../ShimmerEffect/index.js';
import './index.scss';

const baseClass = 'code-editor';

const MonacoEditor = Editor as any;


const CodeEditor: React.FC<Props> = (props) => {
  const { className, height, options, readOnly, ...rest } = props;

  const { theme } = useTheme();

  const classes = [
    baseClass,
    className,
    rest?.defaultLanguage ? `language--${rest.defaultLanguage}` : '',
  ].filter(Boolean).join(' ');

  return (
    <MonacoEditor
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
      className={classes}
      height={height}
      loading={<ShimmerEffect height={height} />}
      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
      {...rest}
    />
  );
};

export default CodeEditor;
