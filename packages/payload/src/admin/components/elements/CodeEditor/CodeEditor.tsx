import Editor from '@monaco-editor/react'
import React from 'react'

import type { Props } from './types'

import { useTheme } from '../../utilities/Theme'
import { ShimmerEffect } from '../ShimmerEffect'
import './index.scss'

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

export default CodeEditor
