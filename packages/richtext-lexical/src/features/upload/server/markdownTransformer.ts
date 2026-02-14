import type { ElementTransformer } from '../../../packages/@lexical/markdown/MarkdownTransformers.js'

import { $isUploadServerNode, UploadServerNode } from './nodes/UploadNode.js'

export const UploadMarkdownTransformer: ElementTransformer = {
  type: 'element',
  dependencies: [UploadServerNode],
  export: (node) => {
    if (!$isUploadServerNode(node)) {
      return null
    }

    const data = node.getData()
    const value = data?.value

    // When the value is a populated document object (not just an ID),
    // we can extract the URL and alt text
    if (value && typeof value === 'object' && 'url' in value) {
      const url = (value as Record<string, unknown>).url as string
      const alt =
        (data.fields as Record<string, unknown>)?.alt ||
        (value as Record<string, unknown>).alt ||
        (value as Record<string, unknown>).filename ||
        ''

      if ((value as Record<string, unknown>).mimeType) {
        const mimeType = (value as Record<string, unknown>).mimeType as string
        // For non-image uploads, output a link instead of an image
        if (!mimeType.startsWith('image')) {
          const filename = ((value as Record<string, unknown>).filename as string) || url
          return `[${filename}](${url})`
        }
      }

      return `![${alt}](${url})`
    }

    // When value is just an ID (not populated), output a reference placeholder
    // so the upload is not silently dropped from the markdown output
    const id = typeof value === 'object' ? (value as Record<string, string>)?.id : value
    return `![${data.relationTo}:${id}]()`
  },
  // This regex is intentionally set to never match during import,
  // as upload nodes should be created through the upload UI, not from markdown
  regExp: /(?!x)x/,
  replace: () => {
    // Upload nodes are not created from markdown input
    return false
  },
}
