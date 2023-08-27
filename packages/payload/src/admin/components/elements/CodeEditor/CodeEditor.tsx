import React from 'react';
import Editor from '@monaco-editor/react';
import type { Props } from './types.js';
import { useTheme } from '../../utilities/Theme/index.js';
import { ShimmerEffect } from '../ShimmerEffect/index.js';

import './index.scss';

const baseClass = 'code-editor';

const MonacoEditor = Editor as any;


const CodeEditor: React.FC<Props> = (props) => {
  const { readOnly, className, options, height, ...rest } = props;

  const { theme } = useTheme();

  const classes = [
    baseClass,
    className,
    rest?.defaultLanguage ? `language--${rest.defaultLanguage}` : '',
  ].filter(Boolean).join(' ');

  return (
    <MonacoEditor
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
