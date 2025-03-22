/* eslint-disable no-console */
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import React from 'react'

import type { SerializedBlockNode, SerializedInlineBlockNode } from '../../../../nodeTypes.js'
import type { JSXConverter, JSXConverters, SerializedLexicalNodeWithParent } from './types.js'

import { hasText } from '../../../../validate/hasText.js'

export type ConvertLexicalToJSXArgs = {
  converters: JSXConverters
  data: SerializedEditorState
  disableIndent?: boolean | string[]
  disableTextAlign?: boolean | string[]
}

export function convertLexicalToJSX({
  converters,
  data,
  disableIndent,
  disableTextAlign,
}: ConvertLexicalToJSXArgs): React.ReactNode {
  if (hasText(data)) {
    return convertLexicalNodesToJSX({
      converters,
      disableIndent,
      disableTextAlign,
      nodes: data?.root?.children,
      parent: data?.root,
    })
  }
  return <></>
}

export function convertLexicalNodesToJSX({
  converters,
  disableIndent,
  disableTextAlign,
  nodes,
  parent,
}: {
  converters: JSXConverters
  disableIndent?: boolean | string[]
  disableTextAlign?: boolean | string[]
  nodes: SerializedLexicalNode[]
  parent: SerializedLexicalNodeWithParent
}): React.ReactNode[] {
  const unknownConverter: JSXConverter<any> = converters.unknown as JSXConverter<any>

  const jsxArray: React.ReactNode[] = nodes.map((node, i) => {
    let converterForNode: JSXConverter<any> | undefined
    if (node.type === 'block') {
      converterForNode = converters?.blocks?.[(node as SerializedBlockNode)?.fields?.blockType]
      if (!converterForNode && !unknownConverter) {
        console.error(
          `Lexical => JSX converter: Blocks converter: found ${(node as SerializedBlockNode)?.fields?.blockType} block, but no converter is provided`,
        )
      }
    } else if (node.type === 'inlineBlock') {
      converterForNode =
        converters?.inlineBlocks?.[(node as SerializedInlineBlockNode)?.fields?.blockType]
      if (!converterForNode && !unknownConverter) {
        console.error(
          `Lexical => JSX converter: Inline Blocks converter: found ${(node as SerializedInlineBlockNode)?.fields?.blockType} inline block, but no converter is provided`,
        )
      }
    } else {
      converterForNode = converters[node.type] as JSXConverter<any>
    }

    try {
      if (!converterForNode && unknownConverter) {
        converterForNode = unknownConverter
      }

      let reactNode: React.ReactNode
      if (converterForNode) {
        const converted =
          typeof converterForNode === 'function'
            ? converterForNode({
                childIndex: i,
                converters,
                node,
                nodesToJSX: (args) => {
                  return convertLexicalNodesToJSX({
                    converters: args.converters ?? converters,
                    disableIndent: args.disableIndent ?? disableIndent,
                    disableTextAlign: args.disableTextAlign ?? disableTextAlign,
                    nodes: args.nodes,
                    parent: args.parent ?? {
                      ...node,
                      parent,
                    },
                  })
                },
                parent,
              })
            : converterForNode
        reactNode = converted
      } else {
        reactNode = <span key={i}>unknown node</span>
      }

      const style: React.CSSProperties = {}

      // Check if disableTextAlign is not true and does not include node type
      if (
        !disableTextAlign &&
        (!Array.isArray(disableTextAlign) || !disableTextAlign?.includes(node.type))
      ) {
        if ('format' in node && node.format) {
          switch (node.format) {
            case 'center':
              style.textAlign = 'center'
              break
            case 'end':
              style.textAlign = 'right'
              break
            case 'justify':
              style.textAlign = 'justify'
              break
            case 'left':
              //style.textAlign = 'left'
              // Do nothing, as left is the default
              break
            case 'right':
              style.textAlign = 'right'
              break
            case 'start':
              style.textAlign = 'left'
              break
          }
        }
      }

      if (
        !disableIndent &&
        (!Array.isArray(disableIndent) || !disableIndent?.includes(node.type))
      ) {
        if ('indent' in node && node.indent && node.type !== 'listitem') {
          style.paddingInlineStart = `${Number(node.indent) * 2}em`
        }
      }

      if (React.isValidElement(reactNode)) {
        // Inject style into reactNode
        if (style.textAlign || style.paddingInlineStart) {
          const newStyle = {
            ...style,
            // @ts-expect-error type better later
            ...(reactNode?.props?.style ?? {}),
            // reactNode style comes after, thus a textAlign specified in the converter has priority over the one we inject here
          }

          return React.cloneElement(reactNode, {
            key: i,
            // @ts-expect-error type better later
            style: newStyle,
          })
        }
        return React.cloneElement(reactNode, {
          key: i,
        })
      }

      return reactNode
    } catch (error) {
      console.error('Error converting lexical node to JSX:', error, 'node:', node)
      return null
    }
  })

  return jsxArray.filter(Boolean)
}
