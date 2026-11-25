import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { PayloadRequest } from 'payload'

import type { SerializedLinkNode } from './schema.js'

import { recurseNodeTree } from '../../../utilities/recurseNodeTree.js'

export const attachFrontendPath = async ({
  node,
  req,
}: {
  node: SerializedLinkNode
  req: PayloadRequest
}): Promise<void> => {
  const doc = node.fields?.doc

  if (
    node.fields?.linkType !== 'internal' ||
    !doc?.value ||
    typeof doc.value !== 'object' ||
    !req.payload.collections[doc.relationTo]?.config.generateFrontendPath
  ) {
    return
  }

  doc.frontendPath = await req.payload.generateFrontendPath({
    collection: doc.relationTo,
    doc: doc.value,
    req,
  })
}

export const stripFrontendPaths = ({
  value,
}: {
  value?: null | SerializedEditorState
}): null | SerializedEditorState | undefined => {
  const flattenedNodes: SerializedLexicalNode[] = []

  recurseNodeTree({ flattenedNodes, nodes: value?.root?.children ?? [] })

  for (const node of flattenedNodes) {
    if (node.type === 'link') {
      delete (node as SerializedLinkNode).fields?.doc?.frontendPath
    }
  }

  return value
}
