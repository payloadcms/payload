type RecordValue = Record<string, unknown>

type SettlementPaymentIntent = {
  amount?: unknown
  currency?: unknown
  customer?: unknown
  id?: unknown
  metadata?: unknown
  status?: unknown
}

type SettlementTransaction = {
  amount?: unknown
  cart?: unknown
  currency?: unknown
  customer?: unknown
  customerEmail?: unknown
  id?: unknown
  items?: unknown
  order?: unknown
  status?: unknown
  stripe?: unknown
}

type SettlementValidationArgs = {
  canonicalCartID: unknown
  cartItemsSnapshot: unknown
  customerEmail: unknown
  paymentIntent: SettlementPaymentIntent
  paymentIntentID: string
  transaction: SettlementTransaction
  user?: { id?: unknown } | null
}

export const getRelationshipID = (value: unknown): string | undefined => {
  const relationshipID = isRecord(value) ? value.id : value

  if (typeof relationshipID === 'number' && Number.isFinite(relationshipID)) {
    return String(relationshipID)
  }

  if (typeof relationshipID === 'string' && relationshipID.trim()) {
    return relationshipID
  }

  return undefined
}

export const normalizeEmail = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalizedEmail = value.trim().toLowerCase()

  return normalizedEmail || undefined
}

export const normalizeCartItems = (items: unknown): unknown[] => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart items are missing or invalid')
  }

  return items.map((item) => {
    if (!isRecord(item)) {
      throw new Error('Cart items are missing or invalid')
    }

    const productID = getRelationshipID(item.product)

    if (!productID || typeof item.quantity !== 'number' || !Number.isFinite(item.quantity)) {
      throw new Error('Cart items are missing or invalid')
    }

    return Object.fromEntries(
      Object.entries(item).flatMap(([key, value]) => {
        if (key === 'product') {
          return [[key, productID]]
        }

        if (key === 'variant') {
          if (value === null || value === undefined) {
            return []
          }

          const variantID = getRelationshipID(value)

          if (!variantID) {
            throw new Error('Cart item variant relationship is invalid')
          }

          return [[key, variantID]]
        }

        const normalizedValue = normalizeValue(value)

        return normalizedValue === undefined ? [] : [[key, normalizedValue]]
      }),
    )
  })
}

export const validateSettlement = ({
  canonicalCartID,
  cartItemsSnapshot,
  customerEmail,
  paymentIntent,
  paymentIntentID,
  transaction,
  user,
}: SettlementValidationArgs): void => {
  if (
    paymentIntentID !== getNestedString(transaction, 'stripe', 'paymentIntentID') ||
    paymentIntentID !== paymentIntent.id
  ) {
    throw new Error('PaymentIntent does not match the transaction')
  }

  const normalizedCartID = getRelationshipID(canonicalCartID)

  if (!normalizedCartID || normalizedCartID !== getRelationshipID(transaction.cart)) {
    throw new Error('Canonical cart does not match the transaction cart')
  }

  const metadata = isRecord(paymentIntent.metadata) ? paymentIntent.metadata : undefined

  if (normalizedCartID !== getRelationshipID(metadata?.cartID)) {
    throw new Error('Canonical cart does not match the PaymentIntent cart')
  }

  const transactionCustomerID = getRelationshipID(transaction.customer)

  if (user !== null && user !== undefined) {
    const authenticatedUserID = getRelationshipID(user.id)

    if (!authenticatedUserID) {
      throw new Error('Authenticated customer ID is missing or invalid')
    }

    if (transactionCustomerID !== authenticatedUserID) {
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

  const stripeCustomerID = getNestedString(transaction, 'stripe', 'customerID')

  if (!stripeCustomerID || stripeCustomerID !== getRelationshipID(paymentIntent.customer)) {
    throw new Error('Stripe customer does not match the transaction')
  }

  if (paymentIntent.amount !== transaction.amount) {
    throw new Error('Stripe amount does not match the transaction amount')
  }

  if (
    typeof paymentIntent.currency !== 'string' ||
    typeof transaction.currency !== 'string' ||
    paymentIntent.currency.toUpperCase() !== transaction.currency
  ) {
    throw new Error('Stripe currency does not match the transaction currency')
  }

  const normalizedSnapshot = normalizeCartItems(cartItemsSnapshot)
  const normalizedTransactionItems = normalizeCartItems(transaction.items)

  if (stableSerialize(normalizedSnapshot) !== stableSerialize(normalizedTransactionItems)) {
    throw new Error('Stripe cart items do not match the transaction items')
  }

  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment not completed.')
  }
}

const getNestedString = (
  value: unknown,
  groupName: string,
  fieldName: string,
): string | undefined => {
  if (!isRecord(value)) {
    return undefined
  }

  const group = value[groupName]

  if (!isRecord(group) || typeof group[fieldName] !== 'string') {
    return undefined
  }

  return group[fieldName]
}

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry))
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).flatMap(([entryKey, entryValue]) => {
        const normalizedValue = normalizeValue(entryValue)

        return normalizedValue === undefined ? [] : [[entryKey, normalizedValue]]
      }),
    )
  }

  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return value
  }

  if (value === undefined) {
    return undefined
  }

  throw new Error('Cart items contain unsupported data')
}

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}
