import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import type { HTMLConverter } from './types'

export function convertLexicalToHTML({
  converters,
  data,
}: {
  converters: HTMLConverter[]
  data: SerializedEditorState
}): string {
  if (data?.root?.children?.length) {
    return convertLexicalNodesToHTML({
      converters,
      lexicalNodes: data?.root?.children,
      parentNodeType: 'root',
    })
  }
  return ''
}

export function convertLexicalNodesToHTML({
  converters,
  lexicalNodes,
  parentNodeType,
}: {
  converters: HTMLConverter[]
  lexicalNodes: SerializedLexicalNode[]

  parentNodeType: string
}): string {
  const unknownConverter = converters.find((converter) => converter.nodeTypes.includes('unknown'))
  return (
    (
      lexicalNodes.map((node, i) => {
        const converterForNode = converters.find((converter) =>
          converter.nodeTypes.includes(node.type),
        )
        if (!converterForNode) {
          return '<span>unknown node</span>'
        }
        const html = converterForNode?.converter({
          childIndex: i,
          converters,
          node,
          parentNodeType,
        })
        return html
      }) || []
    )?.join('') || ''
  )
}
