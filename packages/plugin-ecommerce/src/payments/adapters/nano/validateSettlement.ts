import type { NanoBlockInfo } from './nano.js'

import { getRelationshipID, normalizeEmail } from '../stripe/validateSettlement.js'
import { normalizeAccount, parseRaw, verifySendBlock } from './nano.js'

type RecordValue = Record<string, unknown>

type NanoSettlementArgs = {
  account: string
  block: NanoBlockInfo
  blockHash: string
  canonicalCartID: unknown
  customerEmail: unknown
  maxAgeSeconds: number
  now: number
  reference: string
  transaction: RecordValue
  user?: { id?: unknown } | null
}

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

type NanoIdentityArgs = Pick<
  NanoSettlementArgs,
  'canonicalCartID' | 'customerEmail' | 'reference' | 'transaction' | 'user'
>

/**
 * Checks that the confirmation request belongs to this Nano transaction: reference, cart and
 * purchaser. Used on its own for retries of an already-settled transaction, where the payment
 * checks have already passed and the block may be older than `maxAgeSeconds`.
 */
export const validateNanoSettlementIdentity = ({
  canonicalCartID,
  customerEmail,
  reference,
  transaction,
  user,
}: NanoIdentityArgs): RecordValue => {
  const nano = isRecord(transaction.nano) ? transaction.nano : undefined

  if (transaction.paymentMethod !== 'nano' || !nano || nano.reference !== reference) {
    throw new Error('Nano reference does not match the transaction')
  }

  const normalizedCartID = getRelationshipID(canonicalCartID)

  if (!normalizedCartID || normalizedCartID !== getRelationshipID(transaction.cart)) {
    throw new Error('Canonical cart does not match the transaction cart')
  }

  const transactionCustomerID = getRelationshipID(transaction.customer)

  if (user !== null && user !== undefined) {
    const authenticatedUserID = getRelationshipID(user.id)

    if (!authenticatedUserID || transactionCustomerID !== authenticatedUserID) {
      throw new Error('Authenticated customer does not match the transaction customer')
    }
  } else {
    if (transactionCustomerID) {
      throw new Error('Guest transaction belongs to an authenticated customer')
    }

    const normalizedCustomerEmail = normalizeEmail(customerEmail)

    if (
      !normalizedCustomerEmail ||
      normalizedCustomerEmail !== normalizeEmail(transaction.customerEmail)
    ) {
      throw new Error('Guest email does not match the transaction email')
    }
  }

  return nano
}

/**
 * Checks that a Nano send block pays exactly this pending transaction. Pure: the block is read
 * by the caller, and the one-block-one-transaction rule is enforced by the conditional claim on
 * `nano.blockHash` (backed by its unique index).
 */
export const validateNanoSettlement = ({
  account,
  block,
  blockHash,
  canonicalCartID,
  customerEmail,
  maxAgeSeconds,
  now,
  reference,
  transaction,
  user,
}: NanoSettlementArgs): { priceRaw: bigint } => {
  const nano = validateNanoSettlementIdentity({
    canonicalCartID,
    customerEmail,
    reference,
    transaction,
    user,
  })

  if (transaction.status !== 'pending') {
    throw new Error('Transaction is not pending')
  }

  if (
    typeof nano.blockHash === 'string' &&
    nano.blockHash &&
    nano.blockHash.toUpperCase() !== blockHash.toUpperCase()
  ) {
    throw new Error('Transaction is already settled by another Nano block')
  }

  // The receiving account is the one configured now, so a transaction created before the
  // operator changed accounts cannot be settled by a send to the old one.
  if (typeof nano.payTo !== 'string' || normalizeAccount(nano.payTo) !== account) {
    throw new Error('Nano receiving account does not match the configured account')
  }

  const priceRaw = parseRaw(nano.amountRaw)

  verifySendBlock({ block, maxAgeSeconds, now, payTo: account, priceRaw, reference })

  return { priceRaw }
}
