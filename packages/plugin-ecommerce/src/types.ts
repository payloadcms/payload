import type {
  CollectionConfig,
  DefaultDocumentIDType,
  Endpoint,
  Field,
  GeneratedTypes,
  GroupField,
  PayloadRequest,
  TypedCollection,
} from 'payload'

export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]
export type CollectionOverride = { fields?: FieldsOverride } & Partial<
  Omit<CollectionConfig, 'fields'>
>

export type CartItem = {
  id: DefaultDocumentIDType
  product: DefaultDocumentIDType | TypedCollection['products']
  quantity: number
  variant?: DefaultDocumentIDType | TypedCollection['variants']
}

type DefaultCartType = {
  currency?: string
  customer?: DefaultDocumentIDType | TypedCollection['customers']
  id: DefaultDocumentIDType
  items: CartItem[]
  subtotal?: number
}

export type Cart = DefaultCartType

/**
 * The full payment adapter config expected as part of the config for the Ecommerce plugin.
 *
 * You can insert this type directly or return it from a function constructing it.
 */
export type PaymentAdapter = {
  confirmOrder: (args: {
    /**
     * The slug of the carts collection, defaults to 'carts'.
     * For example, this is used to retrieve the cart for the order.
     */
    cartsSlug?: string
    data: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any // Allows for additional data to be passed through, such as payment method specific data
      cart: Cart
      customerEmail?: string
    }
    /**
     * The slug of the orders collection, defaults to 'orders'.
     */
    ordersSlug?: string
    req: PayloadRequest
    /**
     * The slug of the transactions collection, defaults to 'transactions'.
     * For example, this is used to create a record of the payment intent in the transactions collection.
     */
    transactionsSlug?: string
  }) => Promise<Record<string, unknown>> | Record<string, unknown>
  /**
   * An array of endpoints to be bootstrapped to Payload's API in order to support the payment method. All API paths are relative to `/api/payments/{provider_name}`.
   *
   * So for example, path `/webhooks` in the Stripe adapter becomes `/api/payments/stripe/webhooks`.
   *
   * @example '/webhooks'
   */
  endpoints?: Endpoint[]
  /**
   * A group configuration to be used in the admin interface to display the payment method.
   *
   * @example
   *
   * ```ts
   * const groupField: GroupField = {
      name: 'stripe',
      type: 'group',
      admin: {
        condition: (data) => data?.paymentMethod === 'stripe',
      },
      fields: [
        {
          name: 'stripeCustomerID',
          type: 'text',
          label: 'Stripe Customer ID',
          required: true,
        },
        {
          name: 'stripePaymentIntentID',
          type: 'text',
          label: 'Stripe PaymentIntent ID',
          required: true,
        },
      ],
    }
   * ```
   */
  group: GroupField
  /**
   * Hooks used to manage the lifecycle of the payment method. These are run on transactions at various stages when they update.
   */
  initiatePayment: (args: {
    data: {
      cart: Cart
      currency: string
      customerEmail?: string
    }
    req: PayloadRequest
    /**
     * The slug of the transactions collection, defaults to 'transactions'.
     * For example, this is used to create a record of the payment intent in the transactions collection.
     */
    transactionsSlug: string
  }) => Promise<Record<string, unknown>> | Record<string, unknown>
  /**
   * The label of the payment method
   * @example
   * 'Bank Transfer'
   */
  label?: string
  /**
   * The name of the payment method
   * @example 'stripe'
   */
  name: string
}

export type PaymentAdapterClient = {
  confirmOrder: boolean
  initiatePayment: boolean
} & Pick<PaymentAdapter, 'label' | 'name'>

export type Currency = {
  /**
   * The ISO 4217 currency code
   * @example 'usd'
   */
  code: string
  /**
   * The number of decimal places the currency uses
   * @example 2
   */
  decimals: number
  /**
   * A user friendly name for the currency.
   *
   * @example 'US Dollar'
   */
  label: string
  /**
   * The symbol of the currency
   * @example '$'
   */
  symbol: string
}

/**
 * Commonly used arguments for a Payment Adapter function, it's use is entirely optional.
 */
export type BasePaymentAdapterArgs = {
  /**
   * Overrides the default fields of the collection. Affects the payment fields on collections such as transactions.
   */
  groupOverrides?: { fields?: FieldsOverride } & Partial<Omit<GroupField, 'fields'>>
  /**
   * The visually readable label for the payment method.
   * @example 'Bank Transfer'
   */
  label?: string
}

/**
 * Commonly used arguments for a Payment Adapter function, it's use is entirely optional.
 */
export type BasePaymentAdapterClientArgs = {
  /**
   * The visually readable label for the payment method.
   * @example 'Bank Transfer'
   */
  label?: string
}

export type VariantsConfig = {
  variantOptionsCollection?: CollectionOverride
  variantsCollection?: CollectionOverride
  variantTypesCollection?: CollectionOverride
}

export type ProductsConfig = {
  productsCollection?: CollectionOverride
  variants?: true | VariantsConfig
}

export type OrdersConfig = {
  ordersCollection?: CollectionOverride
}

export type TransactionsConfig = {
  transactionsCollection?: CollectionOverride
}

export type PaymentsConfig = {
  paymentMethods?: PaymentAdapter[]
}

export type CustomersConfig = {
  slug: string
}

export type CartsConfig = {
  cartsCollection?: CollectionOverride
}

export type InventoryConfig = {
  /**
   * Override the default field used to track inventory levels. Defaults to 'inventory'.
   */
  fieldName?: string
}

export type CurrenciesConfig = {
  /**
   * Defaults to the first supported currency.
   *
   * @example 'USD'
   */
  defaultCurrency: string
  /**
   *
   */
  supportedCurrencies: Currency[]
}

/**
 * A map of collection slugs used by the Ecommerce plugin.
 * Provides an easy way to track the slugs of collections even when they are overridden.
 */
export type CollectionSlugMap = {
  carts: string
  customers: string
  orders: string
  products: string
  transactions: string
  variantOptions: string
  variants: string
  variantTypes: string
}

export type EcommercePluginConfig = {
  /**
   * Configure the target collection used for carts.
   *
   * Defaults to true.
   */
  carts?: boolean | CartsConfig
  /**
   * Configure supported currencies and default settings.
   *
   * Defaults to supporting USD.
   */
  currencies?: CurrenciesConfig
  /**
   * Configure the target collection used for customers.
   *
   * @example
   * ```ts
   * customers: {
   *  slug: 'users', // default
   * }
   *
   */
  customers: CustomersConfig
  /**
   * Enable tracking of inventory for products and variants.
   *
   * Defaults to true.
   */
  inventory?: boolean | InventoryConfig
  orders?: boolean | OrdersConfig
  /**
   * Enable tracking of payments. Accepts a config object to override the default collection settings.
   *
   * Defaults to true when the paymentMethods array is provided.
   */
  payments?: PaymentsConfig
  products?: boolean | ProductsConfig
  /**
   * Enable tracking of transactions. Accepts a config object to override the default collection settings.
   *
   * Defaults to true when the paymentMethods array is provided.
   */
  transactions?: boolean | TransactionsConfig
}

export type SanitizedEcommercePluginConfig = {
  currencies: Required<CurrenciesConfig>
  inventory?: InventoryConfig
  payments: {
    paymentMethods: [] | PaymentAdapter[]
  }
} & Omit<Required<EcommercePluginConfig>, 'currencies' | 'inventory' | 'payments'>
