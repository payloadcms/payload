'use client'
import type { Monaco } from '@monaco-editor/react'

import EditorImport from '@monaco-editor/react'
import React, { useState } from 'react'

import type { Props } from './types.js'

import { useTheme } from '../../providers/Theme/index.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'
import { defaultGlobalEditorOptions, defaultOptions } from './constants.js'
import './index.css'

const Editor = 'default' in EditorImport ? EditorImport.default : EditorImport

const baseClass = 'code-editor'

function definePayloadThemes(monaco: Monaco) {
  monaco.editor.defineTheme('payload-light', {
    base: 'vs',
    colors: {
      'editor.background': '#00000000',
      'editor.lineHighlightBackground': '#00000000',
      'editor.lineHighlightBorder': '#00000000',
      'editorGutter.background': '#00000000',
      'editorLineNumber.activeForeground': '#000000b3', // var(--text-default-secondary) - black at 70% opacity
      'editorLineNumber.foreground': '#00000080', // var(--text-default-secondary) - black at 50% opacity
    },
    inherit: true,
    rules: [],
  })
  monaco.editor.defineTheme('payload-dark', {
    base: 'vs-dark',
    colors: {
      'editor.background': '#00000000',
      'editor.lineHighlightBackground': '#00000000',
      'editor.lineHighlightBorder': '#00000000',
      'editorGutter.background': '#00000000',
      'editorLineNumber.activeForeground': '#ffffffb3', // var(--text-default-secondary) - white at 70% opacity
      'editorLineNumber.foreground': '#ffffffb3', // var(--text-default-secondary) - white at 70% opacity
    },
    inherit: true,
    rules: [],
  })
}

const CodeEditor: React.FC<Props> = (props) => {
  const {
    className,
    maxHeight,
    minHeight = 48,
    options,
    readOnly,
    recalculatedHeightAt,
    value,
    ...rest
  } = props
  const LINE_HEIGHT = 16 // Monaco editor line height at fontSize 11
  const EDITOR_BORDER = 2 // 1px top + 1px bottom border
  const CSS_CONTAINER_PADDING = 16 // 8px top + 8px bottom from CSS
  const prevCalculatedHeightAt = React.useRef<number | undefined>(recalculatedHeightAt)

  // Extract per-model settings to avoid global conflicts
  const { insertSpaces, tabSize, trimAutoWhitespace, ...globalEditorOptions } = options || {}
  const paddingFromProps = options?.padding
    ? (options.padding.top || 0) + (options.padding?.bottom || 0)
    : 0

  const [dynamicHeight, setDynamicHeight] = useState(minHeight)
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
          ? Math.max(
              minHeight,
              value.split('\n').length * LINE_HEIGHT +
                EDITOR_BORDER +
                paddingFromProps +
                CSS_CONTAINER_PADDING,
            )
          : minHeight,
      )
      prevCalculatedHeightAt.current = recalculatedHeightAt
    }
  }, [value, minHeight, paddingFromProps, recalculatedHeightAt])

  return (
    <Editor
      beforeMount={definePayloadThemes}
      className={classes}
      height={maxHeight ? Math.min(dynamicHeight, maxHeight) : dynamicHeight}
      loading={<ShimmerEffect height={minHeight} />}
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
      theme={theme === 'dark' ? 'payload-dark' : 'payload-light'}
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
            ? Math.max(
                minHeight,
                value.split('\n').length * LINE_HEIGHT +
                  EDITOR_BORDER +
                  paddingFromProps +
                  CSS_CONTAINER_PADDING,
              )
            : minHeight,
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
          Math.max(
            minHeight,
            editor.getValue().split('\n').length * LINE_HEIGHT +
              EDITOR_BORDER +
              paddingFromProps +
              CSS_CONTAINER_PADDING,
          ),
        )
      }}
    />
  )
}

// eslint-disable-next-line no-restricted-exports
export default CodeEditor
