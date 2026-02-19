import type { ElementTransformer } from '../../../packages/@lexical/markdown/MarkdownTransformers.js'

import {
  $createUploadServerNode,
  $isUploadServerNode,
  UploadServerNode,
} from './nodes/UploadNode.js'

/** Matches upload placeholder written by export: ![relationTo:id]() */
const UPLOAD_PLACEHOLDER_REGEX = /!\[([^\]:]+):([^\]]+)\]\(\)/

export const UploadMarkdownTransformer: ElementTransformer = {
  type: 'element',
  dependencies: [UploadServerNode],
  export: (node) => {
    if (!$isUploadServerNode(node)) {
      return null
    }

    const data = node.getStaleData()
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
  regExp: UPLOAD_PLACEHOLDER_REGEX,
  replace: (parentNode, _children, match, isImport) => {
    if (!isImport || !match[1] || !match[2]) {
      return false
    }
    const relationTo = match[1]
    const value = match[2]
    const id = /^\d+$/.test(value) ? Number(value) : value
    const node = $createUploadServerNode({
      data: {
        fields: {},
        relationTo,
        value: id,
      },
    })
    parentNode.replace(node)
    return true
  },
}
