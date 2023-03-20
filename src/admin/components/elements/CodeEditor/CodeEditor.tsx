import React from 'react';
import Editor from '@monaco-editor/react';
import type { Props } from './types';
import { useTheme } from '../../utilities/Theme';

import './index.scss';
import { ShimmerEffect } from '../ShimmerEffect';

const baseClass = 'code-editor';

const CodeEditor: React.FC<Props> = (props) => {
  const { readOnly, className, options, height, ...rest } = props;

  const { theme } = useTheme();

  const classes = [
    baseClass,
    className,
    rest?.defaultLanguage ? `language--${rest.defaultLanguage}` : '',
  ].filter(Boolean).join(' ');

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
      {...rest}
    />
  );
};

export default CodeEditor;
