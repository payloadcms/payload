'use client'
import EditorImport from '@monaco-editor/react'
import React, { useState } from 'react'

import type { Props } from './types.js'

import { useTheme } from '../../providers/Theme/index.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'
import './index.scss'

const Editor = (EditorImport.default || EditorImport) as unknown as typeof EditorImport.default

const baseClass = 'code-editor'

const CodeEditor: React.FC<Props> = (props) => {
  const { className, maxHeight, minHeight, options, readOnly, ...rest } = props
  const MIN_HEIGHT = minHeight ?? 56 // equivalent to 3 lines
  const paddingFromProps = options?.padding
    ? (options.padding.top || 0) + (options.padding?.bottom || 0)
    : 0

  const [dynamicHeight, setDynamicHeight] = useState(MIN_HEIGHT)
  const { theme } = useTheme()

  const classes = [
    baseClass,
    className,
    rest?.defaultLanguage ? `language--${rest.defaultLanguage}` : '',
    readOnly && 'read-only',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Editor
      className={classes}
      loading={<ShimmerEffect height={dynamicHeight} />}
      options={{
        detectIndentation: true,
        hideCursorInOverviewRuler: true,
        minimap: {
          enabled: false,
        },
        overviewRulerBorder: false,
        readOnly: Boolean(readOnly),
        scrollbar: {
          alwaysConsumeMouseWheel: false,
        },
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: 'on',
        ...options,
      }}
      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
      {...rest}
      // Since we are not building an IDE and the container
      // can already have scrolling, we want the height of the
      // editor to fit its content.
      // See: https://github.com/microsoft/monaco-editor/discussions/3677
      height={maxHeight ? Math.min(dynamicHeight, maxHeight) : dynamicHeight}
      onChange={(value, ev) => {
        rest.onChange?.(value, ev)
        setDynamicHeight(Math.max(MIN_HEIGHT, value.split('\n').length * 18 + 2 + paddingFromProps))
      }}
      onMount={(editor, monaco) => {
        rest.onMount?.(editor, monaco)
        setDynamicHeight(
          Math.max(MIN_HEIGHT, editor.getValue().split('\n').length * 18 + 2 + paddingFromProps),
        )
      }}
    />
  )
}

// eslint-disable-next-line no-restricted-exports
export default CodeEditor
