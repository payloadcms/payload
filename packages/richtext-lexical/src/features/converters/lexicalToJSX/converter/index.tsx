/* eslint-disable no-console */
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import React from 'react'

import type { SerializedBlockNode, SerializedInlineBlockNode } from '../../../../nodeTypes.js'
import type { LexicalEditorNodeMap, NodeMapValue, SerializedNodeBase } from '../../../../types.js'
import type { JSXConverter, JSXConverters, SerializedLexicalNodeWithParent } from './types.js'

import { hasText } from '../../../../validate/hasText.js'

/**
 * Creates a JSX converter from a NodeMapValue
 */
function createConverterFromNodeMapValue(viewDef: NodeMapValue): JSXConverter {
  return (args) => {
    const converterArgs = {
      ...args,
      isEditor: false as const,
      isJSXConverter: true as const,
    }

    // If Component is provided, use it
    if (viewDef.Component) {
      return viewDef.Component(converterArgs)
    }

    // If html is provided (as a function or string), use it
    // Note: Using span instead of div to avoid forcing block-level semantics
    if (viewDef.html) {
      const htmlContent =
        typeof viewDef.html === 'function' ? viewDef.html(converterArgs) : viewDef.html

      return <span dangerouslySetInnerHTML={{ __html: htmlContent }} />
    }

    return null
  }
}

/**
 * Converts a LexicalEditorNodeMap into JSXConverters
 */
function nodeMapToConverters<TNodes extends SerializedNodeBase = SerializedNodeBase>(
  nodeMap: LexicalEditorNodeMap<TNodes>,
): JSXConverters {
  const converters: JSXConverters = {}

  for (const [nodeType, value] of Object.entries(nodeMap)) {
    if (!value || typeof value !== 'object') {
      continue
    }

    // Handle special keys: blocks, inlineBlocks
    if (nodeType === 'blocks') {
      converters.blocks = {}
      for (const [blockType, _viewDef] of Object.entries(value)) {
        const viewDef = _viewDef as NodeMapValue
        if (viewDef.Component || viewDef.html) {
          converters.blocks[blockType] = createConverterFromNodeMapValue(viewDef)
        }
      }
      continue
    }

    if (nodeType === 'inlineBlocks') {
      converters.inlineBlocks = {}
      for (const [blockType, _viewDef] of Object.entries(value)) {
        const viewDef = _viewDef as NodeMapValue
        if (viewDef.Component || viewDef.html) {
          converters.inlineBlocks[blockType] = createConverterFromNodeMapValue(viewDef)
        }
      }
      continue
    }

    // Handle regular node types
    const viewDef = value as NodeMapValue

    if (viewDef.Component || viewDef.html) {
      converters[nodeType] = createConverterFromNodeMapValue(viewDef)
    }
  }

  return converters
}

export type ConvertLexicalToJSXArgs<TNodes extends SerializedNodeBase = SerializedNodeBase> = {
  converters: JSXConverters
  /**
   * Serialized editor state to render.
   */
  data: SerializedEditorState
  /**
   * If true, disables indentation globally. If an array, disables for specific node `type` values.
   */
  disableIndent?: boolean | string[]
  /**
   * If true, disables text alignment globally. If an array, disables for specific node `type` values.
   */
  disableTextAlign?: boolean | string[]
  /**
   * You can use the lexical editor node map or view map as converters. NodeMap converters will override converters passed
   * in the `converters` prop. If a LexicalEditorViewMap is provided, the `default` view will be used.
   */
  nodeMap?: LexicalEditorNodeMap<TNodes>
}

export function convertLexicalToJSX<TNodes extends SerializedNodeBase = SerializedNodeBase>({
  converters,
  data,
  disableIndent,
  disableTextAlign,
  nodeMap,
}: ConvertLexicalToJSXArgs<TNodes>): React.ReactNode {
  if (hasText(data)) {
    // Merge nodeMap converters with existing converters
    // NodeMap converters override existing converters
    const mergedConverters = nodeMap
      ? {
          ...converters,
          ...nodeMapToConverters(nodeMap),
        }
      : converters

    return convertLexicalNodesToJSX({
      converters: mergedConverters,
      disableIndent,
      disableTextAlign,
      nodes: data.root.children,
      parent: data.root,
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
          // the unit should be px. Do not change it to rem, em, or something else.
          // The quantity should be 40px. Do not change it either.
          // See rationale in
          // https://github.com/payloadcms/payload/issues/13130#issuecomment-3058348085
          style.paddingInlineStart = `${Number(node.indent) * 40}px`
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
