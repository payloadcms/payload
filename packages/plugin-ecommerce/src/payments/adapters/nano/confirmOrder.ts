import type { DefaultDocumentIDType, Where } from 'payload'

import type { PaymentAdapter } from '../../../types/index.js'

import { isBlockHash } from './nano.js'
import { fetchBlockInfo } from './nodeClient.js'
import { validateNanoSettlement, validateNanoSettlementIdentity } from './validateSettlement.js'

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

      const storedHash = getStoredBlockHash(transaction)

      // Retry of a confirmation whose settlement already committed (for example the response was
      // lost) or is still committing. The payment was verified when the block was claimed, so
      // only the request identity is re-checked; the core finalizer then returns the existing
      // order instead of creating one. `nano.blockHash` is not rewritten.
      if (
        storedHash === hash &&
        (transaction.status === 'succeeded' || transaction.status === 'processing')
      ) {
        validateNanoSettlementIdentity({
          canonicalCartID: data.cartID,
          customerEmail: data.customerEmail,
          reference,
          transaction,
          user: req.user,
        })
      } else {
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

        await claimBlock({ hash, req, transaction, transactionID, transactionsSlug })
      }

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

type Req = Parameters<NonNullable<PaymentAdapter>['confirmOrder']>[0]['req']

const getStoredBlockHash = (transaction: RecordValue): string | undefined => {
  const nano = transaction.nano as RecordValue | undefined
  const stored = nano?.blockHash

  return typeof stored === 'string' && stored ? stored.toUpperCase() : undefined
}

/**
 * Claims the block for this transaction before the order exists. The write is conditional: it
 * only matches while the transaction is still pending and its `nano.blockHash` is empty or
 * already this hash, so two concurrent confirmations cannot overwrite each other's claim. The
 * unique index on `nano.blockHash` additionally stops one block settling two transactions.
 */
const claimBlock = async ({
  hash,
  req,
  transaction,
  transactionID,
  transactionsSlug,
}: {
  hash: string
  req: Req
  transaction: RecordValue
  transactionID: DefaultDocumentIDType
  transactionsSlug: string
}): Promise<void> => {
  const storedHash = getStoredBlockHash(transaction)
  const claimed = await req.payload.db.updateOne({
    collection: transactionsSlug,
    data: { nano: { ...(transaction.nano as RecordValue), blockHash: hash } },
    options: { atomic: true },
    req,
    where: {
      and: [
        { id: { equals: transactionID } },
        { status: { equals: 'pending' } },
        storedHash === undefined
          ? { 'nano.blockHash': { exists: false } }
          : { 'nano.blockHash': { equals: storedHash } },
      ],
    },
  })

  if (!claimed) {
    throw new Error('Transaction is already settled by another Nano block')
  }

  // Re-read and confirm the stored claim is ours before any order is created.
  const current = await req.payload.findByID({
    id: transactionID,
    collection: transactionsSlug,
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (!current || getStoredBlockHash(current as RecordValue) !== hash) {
    throw new Error('Transaction is already settled by another Nano block')
  }
}

const findOne = async ({
  errorMessage,
  req,
  transactionsSlug,
  where,
}: {
  errorMessage: string
  req: Req
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
