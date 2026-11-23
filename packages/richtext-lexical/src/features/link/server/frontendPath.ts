import type { PayloadRequest } from 'payload'

import type { SerializedLinkNode } from './schema.js'

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

export const stripFrontendPath = ({ node }: { node: SerializedLinkNode }): SerializedLinkNode => {
  if (node.fields?.doc && 'frontendPath' in node.fields.doc) {
    delete node.fields.doc.frontendPath
  }

  return node
}
