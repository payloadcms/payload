import type { FileData, TypeWithID } from 'payload'

import type { ElementTransformer } from '../../../packages/@lexical/markdown/MarkdownTransformers.js'

import { $isUploadServerNode, UploadServerNode } from './nodes/UploadNode.js'

/**
 * Escape special characters in markdown alt text to prevent breaking the syntax.
 * Brackets need to be escaped as they denote the alt text boundaries.
 */
function escapeAltText(text: string): string {
  return text.replace(/[[\]]/g, '\\$&')
}

/**
 * Escape special characters in markdown URLs.
 * Parentheses need to be escaped as they denote the URL boundaries.
 * Spaces should be encoded.
 */
function escapeUrl(url: string): string {
  return url.replace(/[()]/g, '\\$&').replace(/ /g, '%20')
}

/**
 * Markdown transformer for Upload nodes.
 * Exports upload nodes as markdown image syntax: ![alt](url) for images
 * or link syntax: [filename](url) for non-image files.
 *
 * Note: Import is not implemented as we cannot determine the upload collection
 * and document ID from a markdown image URL alone.
 */
export const UploadMarkdownTransformer: ElementTransformer = {
  type: 'element',
  dependencies: [UploadServerNode],
  export: (node) => {
    if (!$isUploadServerNode(node)) {
      return null
    }

    const data = node.getData()

    // If value is not populated (just an ID), we cannot get the URL
    if (!data?.value || typeof data.value === 'string' || typeof data.value === 'number') {
      // Return a comment indicating the upload could not be resolved
      return `<!-- Upload: ${data?.relationTo}/${data?.value} -->`
    }

    const uploadDoc = data.value as { alt?: string } & FileData & TypeWithID

    // Get the URL - it should be available on populated upload documents
    const url = uploadDoc.url

    if (!url) {
      return `<!-- Upload: ${data?.relationTo}/${uploadDoc.id} (no URL) -->`
    }

    // Get alt text from fields or from the upload document
    const alt = (data.fields?.alt as string) || uploadDoc.alt || uploadDoc.filename || ''

    // Check if the upload is an image based on mimeType
    const isImage = uploadDoc.mimeType?.startsWith('image')

    // Escape special characters to prevent breaking markdown syntax
    const escapedAlt = escapeAltText(alt)
    const escapedUrl = escapeUrl(url)

    if (isImage) {
      // Export as markdown image: ![alt](url)
      return `![${escapedAlt}](${escapedUrl})`
    }

    // For non-image files, export as a link: [filename](url)
    const linkText = uploadDoc.filename || alt || 'Download'
    return `[${escapeAltText(linkText)}](${escapedUrl})`
  },
  // Import regex for markdown images - note: import is intentionally not fully implemented
  // because we cannot determine the collection and document ID from a URL alone
  regExp: /^!\[([^\]]*)\]\(([^)]+)\)$/,
  replace: () => {
    // Import is not supported because:
    // 1. We cannot determine which upload collection the image belongs to
    // 2. We cannot determine the document ID from just a URL
    // 3. The URL might not even point to a Payload upload
    // Users should use the editor UI to insert uploads
    return false
  },
}
