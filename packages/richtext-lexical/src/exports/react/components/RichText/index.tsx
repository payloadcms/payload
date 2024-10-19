import type { SerializedEditorState } from 'lexical'

import React from 'react'

import type { JSXConverters } from './converter/types.js'

import { defaultJSXConverters } from './converter/defaultConverters.js'
import { convertLexicalToJSX } from './converter/index.js'

type Props = {
  className?: string
  converters?: ((args: { defaultConverters: JSXConverters[] }) => JSXConverters[]) | JSXConverters[]
  disableIndent?: boolean | string[]
  disableTextAlign?: boolean | string[]
  editorState: SerializedEditorState
}

export const RichText: React.FC<Props> = ({
  className,
  converters,
  disableIndent,
  disableTextAlign,
  editorState,
}) => {
  if (!editorState) {
    return null
  }

  let finalConverters: JSXConverters[] = []
  if (converters) {
    if (typeof converters === 'function') {
      finalConverters = converters({ defaultConverters: [...defaultJSXConverters] })
    } else {
      finalConverters = converters
    }
  } else {
    finalConverters = [...defaultJSXConverters]
  }

  return (
    <div className={className}>
      {editorState &&
        !Array.isArray(editorState) &&
        typeof editorState === 'object' &&
        'root' in editorState &&
        convertLexicalToJSX({
          converters: finalConverters,
          data: editorState,
          disableIndent,
          disableTextAlign,
        })}
    </div>
  )
}
