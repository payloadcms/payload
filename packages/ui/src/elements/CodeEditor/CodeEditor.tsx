'use client'
import EditorImport from '@monaco-editor/react'
import React from 'react'

import type { Props } from './types.js'

import { useTheme } from '../../providers/Theme/index.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'
import './index.scss'

const Editor = (EditorImport.default || EditorImport) as unknown as typeof EditorImport.default

const baseClass = 'code-editor'

const CodeEditor: React.FC<Props> = (props) => {
  const { className, height, options, readOnly, ...rest } = props

  const { theme } = useTheme()

  const classes = [
    baseClass,
    className,
    rest?.defaultLanguage ? `language--${rest.defaultLanguage}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Editor
      className={classes}
      height={height}
      loading={<ShimmerEffect height={height} />}
      options={{
        detectIndentation: true,
        minimap: {
          enabled: false,
        },
        readOnly: Boolean(readOnly),
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: 'on',
        ...options,
      }}
      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
      {...rest}
    />
  )
}

// eslint-disable-next-line no-restricted-exports
export default CodeEditor
