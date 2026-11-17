import type { DefaultDocumentIDType, Where } from 'payload'

import type { PaymentAdapter } from '../../../types/index.js'

import { isBlockHash } from './nano.js'
import { fetchBlockInfo } from './nodeClient.js'
import { validateNanoSettlement } from './validateSettlement.js'

type Props = {
  account: string
  fetchImpl?: typeof fetch
  maxAgeSeconds: number
  nodeHeaders?: Record<string, string>
  nodeURL: string
  now?: () => number
}

type RecordValue = Record<string, unknown>

export const confirmOrder: (props: Props) => NonNullable<PaymentAdapter>['confirmOrder'] =
  (props) =>
  async ({ data, finalizeOrder, req, transactionsSlug = 'transactions' }) => {
    const payload = req.payload
    const { account, fetchImpl, maxAgeSeconds, nodeHeaders, nodeURL } = props
    const now = props.now ?? (() => Math.floor(Date.now() / 1000))
    const reference = data.reference
    const blockHash = data.blockHash

    if (typeof reference !== 'string' || !reference) {
      throw new Error('Nano reference is required')
    }

    if (!isBlockHash(blockHash)) {
      throw new Error('A 64-character Nano block hash is required')
    }

    if (typeof finalizeOrder !== 'function') {
      throw new Error('Core order finalizer is required')
    }

    const hash = blockHash.toUpperCase()

    try {
      const transaction = await findOne({
        errorMessage: 'Expected exactly one transaction for the provided Nano reference',
        req,
        transactionsSlug,
        where: { 'nano.reference': { equals: reference } },
      })
      const transactionID = requireDocumentID(transaction.id)

      const claimed = await req.payload.find({
        collection: transactionsSlug,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        req,
        where: {
          and: [{ 'nano.blockHash': { equals: hash } }, { id: { not_equals: transactionID } }],
        },
      })

      if (claimed.docs.length > 0) {
        throw new Error('This Nano block has already settled another transaction')
      }

      const block = await fetchBlockInfo({ fetchImpl, hash, headers: nodeHeaders, nodeURL })

      validateNanoSettlement({
        account,
        block,
        blockHash: hash,
        canonicalCartID: data.cartID,
        customerEmail: data.customerEmail,
        maxAgeSeconds,
        now: now(),
        reference,
        transaction,
        user: req.user,
      })

      // Claim the block before the order exists. `nano.blockHash` is unique, so a second
      // transaction presenting the same block fails here, also after a restart.
      await req.payload.update({
        id: transactionID,
        collection: transactionsSlug,
        data: { nano: { ...(transaction.nano as RecordValue), blockHash: hash } },
        overrideAccess: true,
        req,
      })

      const nano = transaction.nano as RecordValue
      const purchaser =
        req.user === null || req.user === undefined
          ? { customerEmail: transaction.customerEmail }
          : { customer: requireDocumentID(req.user.id) }

      const order = await finalizeOrder({
        orderData: {
          amount: transaction.amount,
          currency: transaction.currency,
          ...purchaser,
          items: transaction.items,
          ...(nano.shippingAddress ? { shippingAddress: nano.shippingAddress } : {}),
          status: 'processing',
        },
        transactionID,
      })

      return {
        message: 'Payment confirmed successfully',
        orderID: requireDocumentID(order.id),
        transactionID,
        ...(typeof order.accessToken === 'string' ? { accessToken: order.accessToken } : {}),
      }
    } catch (error) {
      payload.logger.error({ err: error, msg: 'Error confirming order with Nano' })

      throw new Error(error instanceof Error ? error.message : 'Unknown error confirming payment')
    }
  }

const findOne = async ({
  errorMessage,
  req,
  transactionsSlug,
  where,
}: {
  errorMessage: string
  req: Parameters<NonNullable<PaymentAdapter>['confirmOrder']>[0]['req']
  transactionsSlug: string
  where: Where
}): Promise<RecordValue> => {
  const result = await req.payload.find({
    collection: transactionsSlug,
    depth: 0,
    limit: 2,
    overrideAccess: true,
    pagination: false,
    req,
    where,
  })

  if (result.totalDocs !== 1 || result.docs.length !== 1 || !result.docs[0]) {
    throw new Error(errorMessage)
  }

  return result.docs[0]
}

const requireDocumentID = (value: unknown): DefaultDocumentIDType => {
  if (
    (typeof value !== 'number' || !Number.isFinite(value)) &&
    (typeof value !== 'string' || !value.trim())
  ) {
    throw new Error('Document ID is missing or invalid')
  }

  return value
}
