import React from 'react'

import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedInlineBlockNode,
} from '../../../../nodeTypes.js'
import type { SerializedNodeBase } from '../../../../types.js'
import type { JSXConverters } from '../converter/types.js'

import { defaultJSXConverters } from '../converter/defaultConverters.js'
import { convertLexicalToJSX, type ConvertLexicalToJSXArgs } from '../converter/index.js'

export type JSXConvertersFunction<
  T extends SerializedNodeBase =
    | DefaultNodeTypes
    | SerializedBlockNode<{ blockName?: null | string }>
    | SerializedInlineBlockNode<{ blockName?: null | string }>,
> = (args: { defaultConverters: JSXConverters<DefaultNodeTypes> }) => JSXConverters<T>

type RichTextProps<TNodes extends SerializedNodeBase = SerializedNodeBase> = {
  /**
   * Override class names for the container.
   */
  className?: string
  /**
   * Custom converters to transform your nodes to JSX. Can be an object or a function that receives the default converters.
   */
  converters?: JSXConverters | JSXConvertersFunction

  /**
   * If true, removes the container div wrapper.
   */
  disableContainer?: boolean
} & Pick<ConvertLexicalToJSXArgs<TNodes>, 'data' | 'disableIndent' | 'disableTextAlign' | 'nodeMap'>

export function RichText<TNodes extends SerializedNodeBase = SerializedNodeBase>({
  className,
  converters,
  data: editorState,
  disableContainer,
  disableIndent,
  disableTextAlign,
  nodeMap,
}: RichTextProps<TNodes>): React.ReactNode {
  if (!editorState) {
    return null
  }

  let finalConverters: JSXConverters = {}
  if (converters) {
    if (typeof converters === 'function') {
      finalConverters = converters({ defaultConverters: defaultJSXConverters })
    } else {
      finalConverters = converters
    }
  } else {
    finalConverters = defaultJSXConverters
  }

  const content =
    editorState &&
    !Array.isArray(editorState) &&
    typeof editorState === 'object' &&
    'root' in editorState &&
    convertLexicalToJSX({
      converters: finalConverters,
      data: editorState,
      disableIndent,
      disableTextAlign,
      nodeMap,
    })

  if (disableContainer) {
    return <>{content}</>
  }

  return <div className={className ?? 'payload-richtext'}>{content}</div>
}
