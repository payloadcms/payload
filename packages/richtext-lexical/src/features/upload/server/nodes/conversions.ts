// This file contains functions used to convert dom elements to upload or pending upload lexical nodes. It requires the actual node
// creation functions to be passed in to stay compatible with both client and server code.
import type { DOMConversionOutput } from 'lexical'

import ObjectID from 'bson-objectid'

import type { $createPendingUploadNode } from '../../client/nodes/PendingUploadNode.js'
import type { $createUploadNode } from '../../client/nodes/UploadNode.js'
import type { $createPendingUploadServerNode } from './PendingUploadNode.js'
import type { $createUploadServerNode } from './UploadNode.js'

export function $convertPendingUploadElement(
  domNode: HTMLImageElement,
  $createNode: typeof $createPendingUploadNode | typeof $createPendingUploadServerNode,
): DOMConversionOutput | null {
  if (domNode.hasAttribute('data-lexical-pending-upload-form-id')) {
    const formID = domNode.getAttribute('data-lexical-pending-upload-form-id')

    if (formID != null) {
      const node = $createNode({
        data: {
          formID,
          src: domNode.getAttribute('src') || '',
        },
      })
      return { node }
    }
  }
  // Create a new pending upload node with a new form ID
  const node = $createNode({
    data: {
      formID: new ObjectID.default().toHexString(),
      src: domNode.getAttribute('src') || '',
    },
  })
  return { node }
}

export function isGoogleDocCheckboxImg(img: HTMLImageElement): boolean {
  return (
    img.parentElement != null &&
    img.parentElement.tagName === 'LI' &&
    img.previousSibling === null &&
    img.getAttribute('aria-roledescription') === 'checkbox'
  )
}

export function $convertUploadElement(
  domNode: HTMLImageElement,
  $createNode: typeof $createUploadNode | typeof $createUploadServerNode,
): DOMConversionOutput | null {
  if (
    domNode.hasAttribute('data-lexical-upload-relation-to') &&
    domNode.hasAttribute('data-lexical-upload-id')
  ) {
    const id = domNode.getAttribute('data-lexical-upload-id')
    const relationTo = domNode.getAttribute('data-lexical-upload-relation-to')

    if (id != null && relationTo != null) {
      const node = $createNode({
        data: {
          fields: {},
          relationTo,
          value: id,
        },
      })
      return { node }
    }
  }
  // Auto-upload functionality is handled here by the PendingUploadNode
  return null
}
