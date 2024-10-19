import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import React from 'react'

import type { JSXConverters, SerializedLexicalNodeWithParent } from './types.js'

export type ConvertLexicalToHTMLArgs = {
  converters: JSXConverters[]
  data: SerializedEditorState
  disableIndent?: boolean | string[]
  disableTextAlign?: boolean | string[]
}

export function convertLexicalToJSX({
  converters,
  data,
  disableIndent,
  disableTextAlign,
}: ConvertLexicalToHTMLArgs): React.ReactNode {
  if (data?.root?.children?.length) {
    const allConverters = {}
    for (const converter of converters) {
      for (const key of Object.keys(converter)) {
        allConverters[key] = converter[key]
      }
    }
    return convertLexicalNodesToJSX({
      converters: allConverters,
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
  const unknownConverter = converters.unknown

  const jsxArray: React.ReactNode[] = nodes.map((node, i) => {
    const converterForNode = converters[node.type]
    try {
      if (!converterForNode) {
        if (unknownConverter) {
          return unknownConverter({
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
        }
        return <span key={i}>unknown node</span>
      }
      const reactNode = converterForNode({
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
            case 'start':
              style.textAlign = 'left'
              break
            case 'right':
              style.textAlign = 'right'
              break
          }
        }
      }

      if (
        !disableIndent &&
        (!Array.isArray(disableIndent) || !disableIndent?.includes(node.type))
      ) {
        if ('indent' in node && node.indent) {
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
      console.error('Error converting lexical node to HTML:', error, 'node:', node)
      return null
    }
  })

  return jsxArray.filter(Boolean).map((jsx) => jsx)
}
