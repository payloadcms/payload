'use client'
import EditorImport from '@monaco-editor/react'
import React, { useState } from 'react'

import type { Props } from './types.js'

import { useTheme } from '../../providers/Theme/index.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'
import { defaultGlobalEditorOptions, defaultOptions } from './constants.js'
import './index.scss'

const Editor = 'default' in EditorImport ? EditorImport.default : EditorImport

const baseClass = 'code-editor'

const CodeEditor: React.FC<Props> = (props) => {
  const {
    className,
    maxHeight,
    minHeight,
    options,
    readOnly,
    recalculatedHeightAt,
    value,
    ...rest
  } = props
  const MIN_HEIGHT = minHeight ?? 56 // equivalent to 3 lines
  const prevCalculatedHeightAt = React.useRef<number | undefined>(recalculatedHeightAt)

  // Extract per-model settings to avoid global conflicts
  const { insertSpaces, tabSize, trimAutoWhitespace, ...globalEditorOptions } = options || {}
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

  React.useEffect(() => {
    if (recalculatedHeightAt && recalculatedHeightAt > prevCalculatedHeightAt.current) {
      setDynamicHeight(
        value
          ? Math.max(MIN_HEIGHT, value.split('\n').length * 18 + 2 + paddingFromProps)
          : MIN_HEIGHT,
      )
      prevCalculatedHeightAt.current = recalculatedHeightAt
    }
  }, [value, MIN_HEIGHT, paddingFromProps, recalculatedHeightAt])

  return (
    <Editor
      className={classes}
      height={maxHeight ? Math.min(dynamicHeight, maxHeight) : dynamicHeight}
      loading={<ShimmerEffect height={dynamicHeight} />}
      options={{
        ...defaultGlobalEditorOptions,
        ...globalEditorOptions,
        readOnly: Boolean(readOnly),
        /**
         * onMount the model will set:
         * - insertSpaces
         * - tabSize
         * - trimAutoWhitespace
         */
        detectIndentation: false,
        insertSpaces: undefined,
        tabSize: undefined,
        trimAutoWhitespace: undefined,
      }}
      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
      value={value}
      {...rest}
      // Since we are not building an IDE and the container
      // can already have scrolling, we want the height of the
      // editor to fit its content.
      // See: https://github.com/microsoft/monaco-editor/discussions/3677
      onChange={(value, ev) => {
        rest.onChange?.(value, ev)
        setDynamicHeight(
          value
            ? Math.max(MIN_HEIGHT, value.split('\n').length * 18 + 2 + paddingFromProps)
            : MIN_HEIGHT,
        )
      }}
      onMount={(editor, monaco) => {
        rest.onMount?.(editor, monaco)

        // Set per-model options to avoid global conflicts
        const model = editor.getModel()
        if (model) {
          model.updateOptions({
            insertSpaces: insertSpaces ?? defaultOptions.insertSpaces,
            tabSize: tabSize ?? defaultOptions.tabSize,
            trimAutoWhitespace: trimAutoWhitespace ?? defaultOptions.trimAutoWhitespace,
          })
        }

        setDynamicHeight(
          Math.max(MIN_HEIGHT, editor.getValue().split('\n').length * 18 + 2 + paddingFromProps),
        )
      }}
    />
  )
}

// eslint-disable-next-line no-restricted-exports
export default CodeEditor
