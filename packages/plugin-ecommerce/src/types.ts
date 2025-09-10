import type {
  Access,
  CollectionConfig,
  DefaultDocumentIDType,
  Endpoint,
  Field,
  FieldAccess,
  GroupField,
  PayloadRequest,
  SelectType,
  TypedCollection,
  Where,
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

type InitiatePaymentReturnType = {
  [key: string]: any // Allows for additional data to be returned, such as payment method specific data
  message: string
}

type InitiatePayment = (args: {
  /**
   * The slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string
  data: {
    /**
     * Billing address for the payment.
     */
    billingAddress: TypedCollection['addresses']
    /**
     * Cart items.
     */
    cart: Cart
    /**
     * Currency code to use for the payment.
     */
    currency: string
    customerEmail: string
    /**
     * Shipping address for the payment.
     */
    shippingAddress?: TypedCollection['addresses']
  }
  req: PayloadRequest
  /**
   * The slug of the transactions collection, defaults to 'transactions'.
   * For example, this is used to create a record of the payment intent in the transactions collection.
   */
  transactionsSlug: string
}) => InitiatePaymentReturnType | Promise<InitiatePaymentReturnType>

type ConfirmOrderReturnType = {
  [key: string]: any // Allows for additional data to be returned, such as payment method specific data
  message: string
  orderID: DefaultDocumentIDType
  transactionID: DefaultDocumentIDType
}

type ConfirmOrder = (args: {
  /**
   * The slug of the carts collection, defaults to 'carts'.
   * For example, this is used to retrieve the cart for the order.
   */
  cartsSlug?: string
  /**
   * The slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string
  /**
   * Data made available to the payment method when confirming an order. You should get the cart items from the transaction.
   */
  data: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any // Allows for additional data to be passed through, such as payment method specific data
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
}) => ConfirmOrderReturnType | Promise<ConfirmOrderReturnType>

/**
 * The full payment adapter config expected as part of the config for the Ecommerce plugin.
 *
 * You can insert this type directly or return it from a function constructing it.
 */
export type PaymentAdapter = {
  confirmOrder: ConfirmOrder
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
  initiatePayment: InitiatePayment
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
  /**
   * Customise the validation used for checking products or variants before a transaction is created.
   */
  validation?: ProductsValidation
  variants?: true | VariantsConfig
}

export type OrdersConfig = {
  ordersCollection?: CollectionOverride
}

export type TransactionsConfig = {
  transactionsCollection?: CollectionOverride
}

export type CustomQuery = {
  depth?: number
  select?: SelectType
  where?: Where
}

export type PaymentsConfig = {
  paymentMethods?: PaymentAdapter[]
  productsQuery?: CustomQuery
  variantsQuery?: CustomQuery
}

export type CountryType = {
  /**
   * A user friendly name for the country.
   */
  label: string
  /**
   * The ISO 3166-1 alpha-2 country code.
   * @example 'US'
   */
  value: string
}

type AddressesConfig = {
  /**
   * These fields will be applied to all locations where addresses are used, such as Orders and Transactions. Preferred use over the collectionOverride config.
   */
  addressFields?: FieldsOverride
  collectionOverride?: CollectionOverride
  supportedCountries?: CountryType[]
}

export type CustomersConfig = {
  /**
   * Slug of the customers collection, defaults to 'users'.
   * This is used to link carts and orders to customers.
   */
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
 * A function that validates a product or variant before a transaction is created or completed.
 * This should throw an error if validation fails as it will be caught by the function calling it.
 */
export type ProductsValidation = (args: {
  currenciesConfig?: CurrenciesConfig
  currency?: string
  product: TypedCollection['products']
  /**
   * Quantity to check the inventory amount against.
   */
  quantity: number
  variant?: TypedCollection['variants']
}) => Promise<void> | void

/**
 * A map of collection slugs used by the Ecommerce plugin.
 * Provides an easy way to track the slugs of collections even when they are overridden.
 */
export type CollectionSlugMap = {
  addresses: string
  carts: string
  customers: string
  orders: string
  products: string
  transactions: string
  variantOptions: string
  variants: string
  variantTypes: string
}

export type AccessConfig = {
  /**
   * Limited to only admin users.
   */
  adminOnly: Access
  /**
   * Limited to only admin users, specifically for Field level access control.
   */
  adminOnlyFieldAccess: FieldAccess
  /**
   * Is the owner of the document via the `customer` field or is an admin.
   */
  adminOrCustomerOwner: Access
  /**
   * The document status is published or user is admin.
   */
  adminOrPublishedStatus: Access
  /**
   * Authenticated users only. Defaults to the example function.
   *
   * @example
   * anyUser: ({ req }) => !!req?.user
   */
  authenticatedOnly?: Access
  /**
   * Limited to customers only, specifically for Field level access control.
   */
  customerOnlyFieldAccess: FieldAccess
  /**
   * Entirely public access. Defaults to the example function.
   *
   * @example
   * publicAccess: () => true
   */
  publicAccess?: Access
}

export type EcommercePluginConfig = {
  /**
   * Customise the access control for the plugin.
   *
   * @example
   * ```ts
   * ```
   */
  access: AccessConfig
  /**
   * Enable the addresses collection to allow customers, transactions and orders to have multiple addresses for shipping and billing. Accepts an override to customise the addresses collection.
   * Defaults to supporting a default set of countries.
   */
  addresses?: AddressesConfig | boolean
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
   * Enable tracking of inventory for products and variants. Accepts a config object to override the default collection settings.
   *
   * Defaults to true.
   */
  inventory?: boolean | InventoryConfig
  /**
   * Enables orders and accepts a config object to override the default collection settings.
   *
   * Defaults to true.
   */
  orders?: boolean | OrdersConfig
  /**
   * Enable tracking of payments. Accepts a config object to override the default collection settings.
   *
   * Defaults to true when the paymentMethods array is provided.
   */
  payments?: PaymentsConfig
  /**
   * Enables products and variants. Accepts a config object to override the product collection and each variant collection type.
   *
   * Defaults to true.
   */
  products?: boolean | ProductsConfig
  /**
   * Enable tracking of transactions. Accepts a config object to override the default collection settings.
   *
   * Defaults to true when the paymentMethods array is provided.
   */
  transactions?: boolean | TransactionsConfig
}

export type SanitizedEcommercePluginConfig = {
  access: Required<AccessConfig>
  addresses: { addressFields: Field[] } & Omit<AddressesConfig, 'addressFields'>
  currencies: Required<CurrenciesConfig>
  inventory?: InventoryConfig
  payments: {
    paymentMethods: [] | PaymentAdapter[]
  }
} & Omit<
  Required<EcommercePluginConfig>,
  'access' | 'addresses' | 'currencies' | 'inventory' | 'payments'
>
