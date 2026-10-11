import type { DefaultDocumentIDType } from 'payload'

import Stripe from 'stripe'

import type { PaymentAdapter } from '../../../types/index.js'
import type { StripeAdapterArgs } from './index.js'

import { normalizeEmail, validateSettlement } from './validateSettlement.js'

type Props = {
  apiVersion?: Stripe.StripeConfig['apiVersion']
  appInfo?: Stripe.StripeConfig['appInfo']
  secretKey: StripeAdapterArgs['secretKey']
}

type RecordValue = Record<string, unknown>

export const confirmOrder: (props: Props) => NonNullable<PaymentAdapter>['confirmOrder'] =
  (props) =>
  async ({ data, finalizeOrder, req, transactionsSlug = 'transactions' }) => {
    const payload = req.payload
    const { apiVersion, appInfo, secretKey } = props || {}
    const paymentIntentID = data.paymentIntentID

    if (!secretKey) {
      throw new Error('Stripe secret key is required')
    }

    if (typeof paymentIntentID !== 'string' || !paymentIntentID) {
      throw new Error('PaymentIntent ID is required')
    }

    if (typeof finalizeOrder !== 'function') {
      throw new Error('Core order finalizer is required')
    }

    const stripe = new Stripe(secretKey, {
      // API version can only be the latest, stripe recommends ts ignoring it
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - ignoring since possible versions are not type safe, only the latest version is recognised
      apiVersion: apiVersion || '2025-03-31.basil',
      appInfo: appInfo || {
        name: 'Stripe Payload Plugin',
        url: 'https://payloadcms.com',
      },
    })

    try {
      const transaction = await findTransaction({ paymentIntentID, req, transactionsSlug })
      const transactionID = requireDocumentID({
        fieldName: 'transaction ID',
        value: transaction.id,
      })
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentID)
      const cartItemsSnapshot = parseRequiredMetadata({
        fieldName: 'cartItemsSnapshot',
        value: paymentIntent.metadata.cartItemsSnapshot,
      })
      const shippingAddress = parseOptionalMetadata({
        fieldName: 'shippingAddress',
        value: paymentIntent.metadata.shippingAddress,
      })
      const purchaser =
        req.user === null || req.user === undefined
          ? { customerEmail: normalizeEmail(data.customerEmail) }
          : {
              customer: requireDocumentID({
                fieldName: 'authenticated customer ID',
                value: req.user.id,
              }),
            }

      validateSettlement({
        canonicalCartID: data.cartID,
        cartItemsSnapshot,
        customerEmail: data.customerEmail,
        paymentIntent,
        paymentIntentID,
        transaction,
        user: req.user,
      })

      const order = await finalizeOrder({
        orderData: {
          amount: transaction.amount,
          currency: transaction.currency,
          ...purchaser,
          items: cartItemsSnapshot,
          shippingAddress,
          status: 'processing',
        },
        transactionID,
      })

      return createConfirmationResult({ order, transactionID })
    } catch (error) {
      payload.logger.error({ err: error, msg: 'Error confirming order with Stripe' })

      throw new Error(error instanceof Error ? error.message : 'Unknown error initiating payment')
    }
  }

const createConfirmationResult = ({
  order,
  transactionID,
}: {
  order: RecordValue
  transactionID: DefaultDocumentIDType
}) => ({
  message: 'Payment initiated successfully',
  orderID: requireDocumentID({ fieldName: 'order ID', value: order.id }),
  transactionID,
  ...(typeof order.accessToken === 'string' ? { accessToken: order.accessToken } : {}),
})

const findTransaction = async ({
  paymentIntentID,
  req,
  transactionsSlug,
}: {
  paymentIntentID: string
  req: Parameters<NonNullable<PaymentAdapter>['confirmOrder']>[0]['req']
  transactionsSlug: string
}): Promise<RecordValue> => {
  const result = await req.payload.find({
    collection: transactionsSlug,
    depth: 0,
    limit: 2,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      'stripe.paymentIntentID': {
        equals: paymentIntentID,
      },
    },
  })

  if (result.totalDocs !== 1 || result.docs.length !== 1 || !result.docs[0]) {
    throw new Error('Expected exactly one transaction for the provided PaymentIntent ID')
  }

  return result.docs[0] as RecordValue
}

const parseOptionalMetadata = ({
  fieldName,
  value,
}: {
  fieldName: string
  value?: string
}): RecordValue | undefined => {
  if (value === undefined) {
    return undefined
  }

  const parsedValue = parseRequiredMetadata({ fieldName, value })

  if (!isRecord(parsedValue)) {
    throw new Error(`${fieldName} metadata is invalid`)
  }

  return parsedValue
}

const parseRequiredMetadata = ({
  fieldName,
  value,
}: {
  fieldName: string
  value?: string
}): unknown => {
  if (typeof value !== 'string' || !value) {
    throw new Error(`${fieldName} metadata is missing or invalid`)
  }

  try {
    return JSON.parse(value)
  } catch {
    throw new Error(`${fieldName} metadata is missing or invalid`)
  }
}

const requireDocumentID = ({
  fieldName,
  value,
}: {
  fieldName: string
  value: unknown
}): DefaultDocumentIDType => {
  if (
    (typeof value !== 'number' || !Number.isFinite(value)) &&
    (typeof value !== 'string' || !value.trim())
  ) {
    throw new Error(`${fieldName} is missing or invalid`)
  }

  return value
}

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
