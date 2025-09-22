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

export type CollectionOverride = (args: {
  defaultCollection: CollectionConfig
}) => CollectionConfig | Promise<CollectionConfig>

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
  /**
   * Allows for additional data to be returned, such as payment method specific data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
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
  /**
   * Allows for additional data to be returned, such as payment method specific data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
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
  /**
   * The function that is called via the `/api/payments/{provider_name}/confirm-order` endpoint to confirm an order after a payment has been made.
   *
   * You should handle the order confirmation logic here.
   *
   * @example
   *
   * ```ts
   * const confirmOrder: ConfirmOrder = async ({ data: { customerEmail }, ordersSlug, req, transactionsSlug }) => {
      // Confirm the payment with Stripe or another payment provider here
      // Create an order in the orders collection here
      // Update the record of the payment intent in the transactions collection here
      return {
        message: 'Order confirmed successfully',
        orderID: 'order_123',
        transactionID: 'txn_123',
        // Include any additional data required for the payment method here
      }
    }
   * ```
   */
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
   * The function that is called via the `/api/payments/{provider_name}/initiate` endpoint to initiate a payment for an order.
   *
   * You should handle the payment initiation logic here.
   *
   * @example
   *
   * ```ts
   * const initiatePayment: InitiatePayment = async ({ data: { cart, currency, customerEmail, billingAddress, shippingAddress }, req, transactionsSlug }) => {
      // Create a payment intent with Stripe or another payment provider here
      // Create a record of the payment intent in the transactions collection here
      return {
        message: 'Payment initiated successfully',
        // Include any additional data required for the payment method here
      }
    }
   * ```
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
export type PaymentAdapterArgs = {
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
export type PaymentAdapterClientArgs = {
  /**
   * The visually readable label for the payment method.
   * @example 'Bank Transfer'
   */
  label?: string
}

export type VariantsConfig = {
  /**
   * Override the default variants collection. If you override the collection, you should ensure it has the required fields for variants or re-use the default fields.
   *
   * @example
   *
   * ```ts
   * variants: {
      variantOptionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...defaultCollection.fields,
          {
            name: 'customField',
            label: 'Custom Field',
            type: 'text',
          },
        ],
      })
    }
  ```
   */
  variantOptionsCollectionOverride?: CollectionOverride
  /**
   * Override the default variants collection. If you override the collection, you should ensure it has the required fields for variants or re-use the default fields.
   *
   * @example
   *
   * ```ts
   * variants: {
      variantsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...defaultCollection.fields,
          {
            name: 'customField',
            label: 'Custom Field',
            type: 'text',
          },
        ],
      })
    }
  ```
   */
  variantsCollectionOverride?: CollectionOverride
  /**
   * Override the default variants collection. If you override the collection, you should ensure it has the required fields for variants or re-use the default fields.
   *
   * @example
   *
   * ```ts
   * variants: {
      variantTypesCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...defaultCollection.fields,
          {
            name: 'customField',
            label: 'Custom Field',
            type: 'text',
          },
        ],
      })
    }
  ```
   */
  variantTypesCollectionOverride?: CollectionOverride
}

export type ProductsConfig = {
  /**
   * Override the default products collection. If you override the collection, you should ensure it has the required fields for products or re-use the default fields.
   *
   * @example
   *
   * ```ts
    products: {
      productsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...defaultCollection.fields,
          {
            name: 'notes',
            label: 'Notes',
            type: 'textarea',
          },
        ],
      })
    }
    ```
   */
  productsCollectionOverride?: CollectionOverride
  /**
   * Customise the validation used for checking products or variants before a transaction is created or a payment can be confirmed.
   */
  validation?: ProductsValidation
  /**
   * Enable variants and provide configuration for the variant collections.
   *
   * Defaults to true.
   */
  variants?: boolean | VariantsConfig
}

export type OrdersConfig = {
  /**
   * Override the default orders collection. If you override the collection, you should ensure it has the required fields for orders or re-use the default fields.
   *
   * @example
   *
   * ```ts
      orders: {
        ordersCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          fields: [
            ...defaultCollection.fields,
            {
              name: 'notes',
              label: 'Notes',
              type: 'textarea',
            },
          ],
        })
      }
    ```
   */
  ordersCollectionOverride?: CollectionOverride
}

export type TransactionsConfig = {
  /**
   * Override the default transactions collection. If you override the collection, you should ensure it has the required fields for transactions or re-use the default fields.
   *
   * @example
   *
   * ```ts
    transactions: {
      transactionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...defaultCollection.fields,
          {
            name: 'notes',
            label: 'Notes',
            type: 'textarea',
          },
        ],
      })
    }
    ```
   */
  transactionsCollectionOverride?: CollectionOverride
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

/**
 * Configuration for the addresses used by the Ecommerce plugin. Use this to override the default collection or fields used throughout
 */
type AddressesConfig = {
  /**
   * Override the default addresses collection. If you override the collection, you should ensure it has the required fields for addresses or re-use the default fields.
   *
   * @example
   * ```ts
   * addressesCollectionOverride: (defaultCollection) => {
   *  return {
   *    ...defaultCollection,
   *    fields: [
   *      ...defaultCollection.fields,
   *      // add custom fields here
   *    ],
   *  }
   * }
   * ```
   */
  addressesCollectionOverride?: CollectionOverride
  /**
   * These fields will be applied to all locations where addresses are used, such as Orders and Transactions. Preferred use over the collectionOverride config.
   */
  addressFields?: FieldsOverride
  /**
   * Provide an array of countries to support for addresses. This will be used in the admin interface to provide a select field of countries.
   *
   * Defaults to a set of commonly used countries.
   *
   * @example
   * ```
   * [
      { label: 'United States', value: 'US' },
      { label: 'Canada', value: 'CA' },
    ]
   */
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
  cartsCollectionOverride?: CollectionOverride
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
  /**
   * The full currencies config, allowing you to check against supported currencies and their settings.
   */
  currenciesConfig?: CurrenciesConfig
  /**
   * The ISO 4217 currency code being usen in this transaction.
   */
  currency?: string
  /**
   * The full product data.
   */
  product: TypedCollection['products']
  /**
   * Quantity to check the inventory amount against.
   */
  quantity: number
  /**
   * The full variant data, if a variant was selected for the product otherwise it will be undefined.
   */
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

/**
 * Access control functions used throughout the Ecommerce plugin.
 * You must provide these when configuring the plugin.
 *
 * @example
 *
 * ```ts
 *  access: {
      adminOnly,
      adminOnlyFieldAccess,
      adminOrCustomerOwner,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
    }
  ```
 */
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
