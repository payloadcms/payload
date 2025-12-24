import React from 'react'

import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedInlineBlockNode,
} from '../../../../nodeTypes.js'
import type { JSXConverters } from '../converter/types.js'

import { defaultJSXConverters } from '../converter/defaultConverters.js'
import { convertLexicalToJSX, type ConvertLexicalToJSXArgs } from '../converter/index.js'

export type JSXConvertersFunction<
  T extends { [key: string]: any; type?: string } =
    | DefaultNodeTypes
    | SerializedBlockNode<{ blockName?: null | string }>
    | SerializedInlineBlockNode<{ blockName?: null | string }>,
> = (args: { defaultConverters: JSXConverters<DefaultNodeTypes> }) => JSXConverters<T>

type RichTextProps = {
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
} & Pick<ConvertLexicalToJSXArgs, 'data' | 'disableIndent' | 'disableTextAlign' | 'nodeMap'>

export const RichText: React.FC<RichTextProps> = ({
  className,
  converters,
  data: editorState,
  disableContainer,
  disableIndent,
  disableTextAlign,
  nodeMap,
}) => {
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
