import type { PayloadRequest } from 'payload'
import type { ClientUploadReceipt } from 'payload/internal'

import { verifyClientUploadReceipt } from 'payload/internal'

import { assertReceiptMatchesFileKey } from './assertReceiptMatchesFileKey.js'

type Args = {
  collectionPrefix?: string
  collectionSlug: string
  expectedFileKey: string
  req: PayloadRequest
  signedReceipt: string
  useCompositePrefixes?: boolean
}

/**
 * Authenticates a client-upload receipt and asserts it authorizes writing to
 * `expectedFileKey`, returning the verified receipt. Combines
 * {@link verifyClientUploadReceipt} (authentication + collection binding) with
 * {@link assertReceiptMatchesFileKey} (storage-key binding) so an adapter binds
 * the receipt to its request in a single call.
 */
export function verifyClientUploadReceiptForFileKey({
  collectionPrefix,
  collectionSlug,
  expectedFileKey,
  req,
  signedReceipt,
  useCompositePrefixes,
}: Args): ClientUploadReceipt {
  const receipt = verifyClientUploadReceipt({ collectionSlug, req, signedReceipt })

  assertReceiptMatchesFileKey({ collectionPrefix, expectedFileKey, receipt, useCompositePrefixes })

  return receipt
}
