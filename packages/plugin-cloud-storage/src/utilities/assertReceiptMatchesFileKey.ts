import type { ClientUploadReceipt } from 'payload/internal'

import { APIError } from 'payload'

import { buildPrefixWithObjectKey } from './buildPrefixWithObjectKey.js'
import { buildStoragePathData } from './buildStoragePathData.js'

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

  const objectKey: string = (receipt?.context?._objectKey as string) ?? ''
  if (objectKey && typeof objectKey !== 'string') {
    throw new APIError('Client upload reference does not match this request.', 400)
  }

  const { storageFilePath } = buildStoragePathData({
    collectionPrefix,
    docPrefix: buildPrefixWithObjectKey({ objectKey, prefix: receiptPrefix }),
    filename: receipt.filename,
    useCompositePrefixes,
  })

  if (storageFilePath !== expectedFileKey) {
    throw new APIError('Client upload reference does not match this request.', 400)
  }
}
