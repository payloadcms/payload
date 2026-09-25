import {
  addDataAndFileToRequest,
  commitTransaction,
  type DefaultDocumentIDType,
  type Endpoint,
  initTransaction,
  killTransaction,
} from 'payload'

import type {
  CurrenciesConfig,
  PaymentAdapter,
  ProductsValidation,
  SanitizedEcommercePluginConfig,
  UserWithCart,
} from '../types/index.js'

import { getInventoryFieldName } from '../utilities/inventory.js'

type ConfirmOrderArgs = Parameters<PaymentAdapter['confirmOrder']>[0]
type FinalizeOrder = ConfirmOrderArgs['finalizeOrder']
type RecordValue = Record<string, unknown>

const SETTLEMENT_POLL_INTERVAL_MS = 25
const SETTLEMENT_WAIT_TIMEOUT_MS = 500

type Args = {
  /**
   * The slug of the carts collection, defaults to 'carts'.
   */
  cartsSlug?: string
  currenciesConfig: CurrenciesConfig
  /**
   * The slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string
  /**
   * Track inventory stock for the products and variants.
   * Accepts an object to override the default field name.
   */
  inventory?: SanitizedEcommercePluginConfig['inventory']
  /**
   * The slug of the orders collection, defaults to 'orders'.
   */
  ordersSlug?: string
  paymentMethod: PaymentAdapter
  /**
   * The slug of the products collection, defaults to 'products'.
   */
  productsSlug?: string
  /**
   * Customise the validation used for checking products or variants before a transaction is created.
   */
  productsValidation?: ProductsValidation
  /**
   * The slug of the transactions collection, defaults to 'transactions'.
   */
  transactionsSlug?: string
  /**
   * The slug of the variants collection, defaults to 'variants'.
   */
  variantsSlug?: string
}

type ConfirmOrderHandler = (args: Args) => Endpoint['handler']

/**
 * Handles the endpoint for initiating payments. We will handle checking the amount and product and variant prices here before it is sent to the payment provider.
 * This is the first step in the payment process.
 */
export const confirmOrderHandler: ConfirmOrderHandler =
  ({
    cartsSlug = 'carts',
    currenciesConfig,
    customersSlug = 'users',
    inventory,
    ordersSlug = 'orders',
    paymentMethod,
    productsSlug = 'products',
    productsValidation,
    transactionsSlug = 'transactions',
    variantsSlug = 'variants',
  }) =>
  async (req) => {
    await addDataAndFileToRequest(req)

    const data = req.data
    const payload = req.payload
    const user = req.user as null | UserWithCart
    const inventoryFieldName = inventory ? getInventoryFieldName({ inventory }) : false

    let currency: string = currenciesConfig.defaultCurrency
    let cartID: DefaultDocumentIDType = data?.cartID
    let cart = undefined
    let customerEmail: string = user?.email ?? ''
    const cartSecret = data?.secret

    if (user) {
      if (user.cart?.docs && Array.isArray(user.cart.docs) && user.cart.docs.length > 0) {
        if (!cartID && user.cart.docs[0]) {
          // Use the user's cart instead
          if (typeof user.cart.docs[0] === 'object') {
            cartID = user.cart.docs[0].id
            cart = user.cart.docs[0]
          } else {
            cartID = user.cart.docs[0]
          }
        }
      }
    } else {
      // Get the email from the data if user is not available
      if (
        typeof data?.customerEmail === 'string' &&
        normalizeEmail(data.customerEmail).length > 0
      ) {
        customerEmail = data.customerEmail
      } else {
        return Response.json(
          {
            message: 'A customer email is required to make a purchase.',
          },
          {
            status: 400,
          },
        )
      }
    }

    if (!cart) {
      if (cartID) {
        // Add cart secret to query for guest cart access control
        if (cartSecret && typeof cartSecret === 'string') {
          req.query = req.query || {}
          req.query.secret = cartSecret
        }

        cart = await payload.findByID({
          id: cartID,
          collection: cartsSlug,
          depth: 2,
          overrideAccess: false,
          req,
          select: {
            id: true,
            currency: true,
            customerEmail: true,
            items: true,
            subtotal: true,
          },
        })

        if (!cart) {
          return Response.json(
            {
              message: `Cart with ID ${cartID} not found.`,
            },
            {
              status: 404,
            },
          )
        }
      } else {
        return Response.json(
          {
            message: 'Cart ID is required.',
          },
          {
            status: 400,
          },
        )
      }
    }

    if (cart.currency && typeof cart.currency === 'string') {
      currency = cart.currency
    }

    // Ensure the currency is provided or inferred in some way
    if (!currency) {
      return Response.json(
        {
          message: 'Currency is required.',
        },
        {
          status: 400,
        },
      )
    }

    let shouldCommit = false

    try {
      const canonicalCartID = cart.id
      if (
        canonicalCartID === null ||
        canonicalCartID === undefined ||
        (typeof canonicalCartID === 'string' && canonicalCartID.trim() === '')
      ) {
        throw new Error('Canonical cart ID is required.')
      }

      const cartCustomerEmail = 'customerEmail' in cart ? cart.customerEmail : undefined
      const normalizedCartCustomerEmail = normalizeEmail(cartCustomerEmail)
      const normalizedSubmittedCustomerEmail = normalizeEmail(customerEmail)
      const canonicalEmail = user
        ? normalizeEmail(user.email)
        : normalizedCartCustomerEmail || normalizedSubmittedCustomerEmail

      if (
        !user &&
        normalizedCartCustomerEmail &&
        normalizedSubmittedCustomerEmail !== normalizedCartCustomerEmail
      ) {
        throw new Error('Customer email does not match the cart.')
      }

      shouldCommit = await initTransaction(req)
      const hadActiveTransaction = Boolean(await req.transactionID)
      let didCallFinalizeOrder = false
      let didFinalizeOrder = false
      let didRecoverTransientConflict = false
      let finalizedTransactionID: DefaultDocumentIDType | undefined

      const finalizeOrder: FinalizeOrder = async ({ orderData, transactionID }) => {
        if (didCallFinalizeOrder) {
          throw new Error('Order settlement was already finalized for this request.')
        }

        didCallFinalizeOrder = true
        finalizedTransactionID = transactionID

        let order: RecordValue

        try {
          order = await finalizeTransactionOrder({
            cartID: canonicalCartID,
            cartsSlug,
            inventoryFieldName,
            orderData,
            ordersSlug,
            productsSlug,
            req,
            transactionID,
            transactionsSlug,
            variantsSlug,
          })
        } catch (error) {
          if (!shouldCommit || !isTransientTransactionConflict(error)) {
            throw error
          }

          // MongoDB reports a losing transactional claim as a transient write conflict rather
          // than a null compare-and-set result. Leave the aborted snapshot before polling.
          await killTransaction(req)
          shouldCommit = false
          order = await waitForCanonicalOrder({
            ordersSlug,
            req,
            transactionID,
            transactionsSlug,
          })
          didRecoverTransientConflict = true
        }

        didFinalizeOrder = true

        return order
      }

      const paymentResponse = await paymentMethod.confirmOrder({
        cartsSlug,
        customersSlug,
        data: {
          ...data,
          cartID: canonicalCartID,
          customerEmail: canonicalEmail,
        },
        finalizeOrder,
        ordersSlug,
        req,
        transactionsSlug,
      })
      const hasActiveTransaction = Boolean(await req.transactionID)
      const transactionID = paymentResponse.transactionID

      if (!isValidDocumentID(transactionID)) {
        throw new Error('Transaction ID is missing or invalid.')
      }

      if (!didCallFinalizeOrder) {
        throw new Error('Payment adapter did not finalize the order.')
      }

      if (!didFinalizeOrder) {
        throw new Error('Order settlement did not complete successfully.')
      }

      if (
        didFinalizeOrder &&
        getRelationshipID(transactionID) !== getRelationshipID(finalizedTransactionID)
      ) {
        throw new Error('Confirmation response transaction does not match the settlement.')
      }

      if (hadActiveTransaction && !hasActiveTransaction && !didRecoverTransientConflict) {
        throw new Error('Order confirmation lost its active transaction.')
      }

      if (shouldCommit && hasActiveTransaction) {
        await commitTransaction(req)
      }

      return Response.json(paymentResponse)
    } catch (err) {
      if (shouldCommit) {
        await killTransaction(req)
      }

      payload.logger.error({ err, msg: 'Error confirming order.' })

      return Response.json(
        {
          message: 'Error confirming order.',
        },
        {
          status: 500,
        },
      )
    }
  }

const normalizeEmail = (email: unknown): string =>
  typeof email === 'string' ? email.trim().toLowerCase() : ''

const isValidDocumentID = (id: unknown): id is DefaultDocumentIDType =>
  (typeof id === 'number' && Number.isFinite(id)) ||
  (typeof id === 'string' && id.trim().length > 0)

const finalizeTransactionOrder = async ({
  cartID,
  cartsSlug,
  inventoryFieldName,
  orderData,
  ordersSlug,
  productsSlug,
  req,
  transactionID,
  transactionsSlug,
  variantsSlug,
}: {
  cartID: DefaultDocumentIDType
  cartsSlug: string
  inventoryFieldName: false | string
  orderData: Record<string, unknown>
  ordersSlug: string
  productsSlug: string
  req: ConfirmOrderArgs['req']
  transactionID: DefaultDocumentIDType
  transactionsSlug: string
  variantsSlug: string
}): Promise<RecordValue> => {
  if (!isValidDocumentID(transactionID)) {
    throw new Error('Transaction ID is missing or invalid.')
  }

  if (!isRecord(orderData)) {
    throw new Error('Order data is missing or invalid.')
  }

  const claimedTransaction = await req.payload.db.updateOne({
    collection: transactionsSlug,
    data: { status: 'processing' },
    options: { atomic: true },
    req,
    where: {
      and: [
        { id: { equals: transactionID } },
        { status: { equals: 'pending' } },
        { order: { exists: false } },
      ],
    },
  })

  if (!claimedTransaction) {
    return waitForCanonicalOrder({ ordersSlug, req, transactionID, transactionsSlug })
  }

  if (getRelationshipID(claimedTransaction.id) !== getRelationshipID(transactionID)) {
    throw new Error('Claimed transaction does not match the requested transaction.')
  }

  const transaction = await req.payload.findByID({
    id: transactionID,
    collection: transactionsSlug,
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (
    !transaction ||
    getRelationshipID(transaction.id) !== getRelationshipID(transactionID) ||
    transaction.status !== 'processing'
  ) {
    throw new Error('Claimed transaction could not be loaded for settlement.')
  }

  const referencedOrders = await req.payload.find({
    collection: ordersSlug,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: { transactions: { equals: transactionID } },
  })

  if (referencedOrders.totalDocs !== 0 || referencedOrders.docs.length !== 0) {
    throw new Error('An order already references the claimed transaction.')
  }

  const order = (await req.payload.create({
    collection: ordersSlug,
    data: {
      ...orderData,
      transactions: [transactionID],
    },
    overrideAccess: true,
    req,
  })) as RecordValue
  const orderID = requireDocumentID({ fieldName: 'order ID', value: order.id })

  await req.payload.update({
    id: cartID,
    collection: cartsSlug,
    data: { purchasedAt: new Date().toISOString() },
    overrideAccess: true,
    req,
  })

  if (inventoryFieldName) {
    await decrementInventory({
      fieldName: inventoryFieldName,
      items: transaction.items,
      productsSlug,
      req,
      variantsSlug,
    })
  }

  await req.payload.update({
    id: transactionID,
    collection: transactionsSlug,
    data: { order: orderID, status: 'succeeded' },
    overrideAccess: true,
    req,
  })

  return order
}

const decrementInventory = async ({
  fieldName,
  items,
  productsSlug,
  req,
  variantsSlug,
}: {
  fieldName: string
  items: unknown
  productsSlug: string
  req: ConfirmOrderArgs['req']
  variantsSlug: string
}): Promise<void> => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Inventory transaction items are missing or invalid.')
  }

  for (const item of items) {
    if (
      !isRecord(item) ||
      typeof item.quantity !== 'number' ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error('Inventory item quantity is missing or invalid.')
    }

    const hasVariant = item.variant !== null && item.variant !== undefined
    const id = hasVariant ? item.variant : item.product

    if (!isValidDocumentID(id)) {
      throw new Error('Inventory item target is missing or invalid.')
    }

    const updatedInventory = await req.payload.db.updateOne({
      id,
      collection: hasVariant ? variantsSlug : productsSlug,
      data: { [fieldName]: { $inc: item.quantity * -1 } },
      req,
    })

    if (!updatedInventory) {
      throw new Error('Inventory item could not be updated.')
    }
  }
}

const waitForCanonicalOrder = async ({
  ordersSlug,
  req,
  transactionID,
  transactionsSlug,
}: {
  ordersSlug: string
  req: ConfirmOrderArgs['req']
  transactionID: DefaultDocumentIDType
  transactionsSlug: string
}): Promise<RecordValue> => {
  const deadline = Date.now() + SETTLEMENT_WAIT_TIMEOUT_MS

  do {
    const transaction = await req.payload.findByID({
      id: transactionID,
      collection: transactionsSlug,
      depth: 0,
      overrideAccess: true,
      req,
    })

    if (!transaction) {
      throw new Error('Canonical transaction was not found.')
    }

    if (transaction.status === 'succeeded') {
      return findExactlyLinkedOrder({
        orderID: transaction.order,
        ordersSlug,
        req,
        transactionID,
      })
    }

    if (transaction.status !== 'pending' && transaction.status !== 'processing') {
      throw new Error('Transaction is not available for settlement.')
    }

    if (Date.now() >= deadline) {
      break
    }

    await new Promise<void>((resolve) =>
      setTimeout(resolve, Math.min(SETTLEMENT_POLL_INTERVAL_MS, deadline - Date.now())),
    )
  } while (Date.now() <= deadline)

  throw new Error('Transaction settlement did not complete in time.')
}

const findExactlyLinkedOrder = async ({
  orderID,
  ordersSlug,
  req,
  transactionID,
}: {
  orderID: unknown
  ordersSlug: string
  req: ConfirmOrderArgs['req']
  transactionID: DefaultDocumentIDType
}): Promise<RecordValue> => {
  const canonicalOrderID = requireDocumentID({ fieldName: 'order ID', value: orderID })
  const result = await req.payload.find({
    collection: ordersSlug,
    depth: 0,
    limit: 2,
    overrideAccess: true,
    pagination: false,
    req,
    where: { transactions: { equals: transactionID } },
  })

  if (
    result.totalDocs !== 1 ||
    result.docs.length !== 1 ||
    getRelationshipID(result.docs[0]?.id) !== getRelationshipID(canonicalOrderID)
  ) {
    throw new Error('Transaction does not have exactly one canonical linked order.')
  }

  return result.docs[0] as RecordValue
}

const getRelationshipID = (value: unknown): string | undefined => {
  const id = isRecord(value) ? value.id : value

  return isValidDocumentID(id) ? String(id) : undefined
}

const requireDocumentID = ({
  fieldName,
  value,
}: {
  fieldName: string
  value: unknown
}): DefaultDocumentIDType => {
  const id = isRecord(value) ? value.id : value

  if (!isValidDocumentID(id)) {
    throw new Error(`${fieldName} is missing or invalid.`)
  }

  return id
}

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isTransientTransactionConflict = (error: unknown): boolean => {
  if (!isRecord(error)) {
    return false
  }

  return (
    error.code === 112 ||
    error.codeName === 'WriteConflict' ||
    (Array.isArray(error.errorLabels) && error.errorLabels.includes('TransientTransactionError'))
  )
}
