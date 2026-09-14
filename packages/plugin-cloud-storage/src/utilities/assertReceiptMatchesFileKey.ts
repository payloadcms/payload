import type { ClientUploadReceipt } from 'payload/internal'

import { APIError } from 'payload'

import { getFileKey } from './getFileKey.js'

type Args = {
  collectionPrefix?: string
  expectedFileKey: string
  receipt: ClientUploadReceipt
  useCompositePrefixes?: boolean
}

/**
 * Asserts a signed client-upload receipt authorizes writing to `expectedFileKey` by recomputing
 * the key from the receipt's own prefix, `_objectKey`, and filename. Collection binding is enforced
 * separately by {@link verifyClientUploadReceipt}.
 */
export function assertReceiptMatchesFileKey({
  collectionPrefix = '',
  expectedFileKey,
  receipt,
  useCompositePrefixes = false,
}: Args): void {
  const receiptPrefix = receipt.context.prefix
  if (typeof receiptPrefix !== 'string') {
    throw new APIError('Client upload reference does not match this request.', 400)
  }

  // The issued key folds `_objectKey` after the prefix, so recompute with it.
  const receiptObjectKey =
    typeof receipt.context._objectKey === 'string' ? receipt.context._objectKey : ''
  const docPrefix = receiptObjectKey
    ? receiptPrefix
      ? `${receiptPrefix}/${receiptObjectKey}`
      : receiptObjectKey
    : receiptPrefix

  const { fileKey } = getFileKey({
    collectionPrefix,
    docPrefix,
    filename: receipt.filename,
    useCompositePrefixes,
  })

  if (fileKey !== expectedFileKey) {
    throw new APIError('Client upload reference does not match this request.', 400)
  }
}
