import type {
  Access,
  CollectionConfig,
  DefaultDocumentIDType,
  Endpoint,
  Field,
  FieldAccess,
  GroupField,
  PayloadRequest,
  PopulateType,
  SelectType,
  TypedCollection,
  Where,
} from 'payload'
import type React from 'react'

import type { TypedEcommerce } from './utilities.js'

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
  /**
   * Allow guest (unauthenticated) users to create carts.
   * When enabled, guests can create carts without being logged in.
   * Defaults to true.
   */
  allowGuestCarts?: boolean
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
 * Provide atomic access functions that can be composed using or, and, conditional utilities.
 *
 * @example
 * ```ts
 *  access: {
 *    isAdmin: ({ req }) => checkRole(['admin'], req.user),
 *    isAuthenticated: ({ req }) => !!req.user,
 *    isDocumentOwner: ({ req }) => {
 *      if (!req.user) return false
 *      return { customer: { equals: req.user.id } }
 *    },
 *    adminOnlyFieldAccess: ({ req }) => checkRole(['admin'], req.user),
 *    customerOnlyFieldAccess: ({ req }) => !!req.user,
 *    adminOrPublishedStatus: ({ req }) => {
 *      if (checkRole(['admin'], req.user)) return true
 *      return { _status: { equals: 'published' } }
 *    },
 *  }
 * ```
 */
export type AccessConfig = {
  /**
   * Limited to only admin users, specifically for Field level access control.
   */
  adminOnlyFieldAccess: FieldAccess
  /**
   * The document status is published or user is admin.
   */
  adminOrPublishedStatus: Access
  /**
   * Limited to customers only, specifically for Field level access control.
   */
  customerOnlyFieldAccess: FieldAccess
  /**
   * Checks if the user is an admin.
   * @returns true if admin, false otherwise
   */
  isAdmin: Access
  /**
   * Checks if the user is authenticated (any role).
   * @returns true if authenticated, false otherwise
   */
  isAuthenticated?: Access
  /**
   * Checks if the user owns the document being accessed.
   * Typically returns a Where query to filter by customer field.
   * @returns true for full access, false for no access, or Where query for conditional access
   */
  isDocumentOwner: Access
  /**
   * Entirely public access. Defaults to returning true.
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
   * Override the default slugs used across the plugin. This lets the plugin know which slugs to use for various internal operations and fields.
   */
  slugMap?: Partial<CollectionSlugMap>
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

export type EcommerceCollections = TypedEcommerce['collections']

export type AddressesCollection = EcommerceCollections['addresses']
export type CartsCollection = EcommerceCollections['carts']

export type SyncLocalStorageConfig = {
  /**
   * Key to use for localStorage.
   * Defaults to 'cart'.
   */
  key?: string
}

type APIProps = {
  /**
   * The route for the Payload API, defaults to `/api`.
   */
  apiRoute?: string
  /**
   * Customise the query used to fetch carts. Use this when you need to fetch additional data and optimise queries using depth, select and populate.
   *
   * Defaults to `{ depth: 0 }`.
   */
  cartsFetchQuery?: {
    depth?: number
    populate?: PopulateType
    select?: SelectType
  }
  /**
   * The route for the Payload API, defaults to ``. Eg for a Payload app running on `http://localhost:3000`, the default serverURL would be `http://localhost:3000`.
   */
  serverURL?: string
}

export type ContextProps = {
  /**
   * The slug for the addresses collection.
   *
   * Defaults to 'addresses'.
   */
  addressesSlug?: string
  api?: APIProps
  /**
   * The slug for the carts collection.
   *
   * Defaults to 'carts'.
   */
  cartsSlug?: string
  children?: React.ReactNode
  /**
   * The configuration for currencies used in the ecommerce context.
   * This is used to handle currency formatting and calculations, defaults to USD.
   */
  currenciesConfig?: CurrenciesConfig
  /**
   * The slug for the customers collection.
   *
   * Defaults to 'users'.
   */
  customersSlug?: string
  /**
   * Enable debug mode for the ecommerce context. This will log additional information to the console.
   * Defaults to false.
   */
  debug?: boolean
  /**
   * Whether to enable support for variants in the cart.
   * This allows adding products with specific variants to the cart.
   * Defaults to false.
   */
  enableVariants?: boolean
  /**
   * Supported payment methods for the ecommerce context.
   */
  paymentMethods?: PaymentAdapterClient[]
  /**
   * Whether to enable localStorage for cart persistence.
   * Defaults to true.
   */
  syncLocalStorage?: boolean | SyncLocalStorageConfig
}

/**
 * Type used internally to represent the cart item to be added.
 */
type CartItemArgument = {
  /**
   * The ID of the product to add to the cart. Always required.
   */
  product: DefaultDocumentIDType
  /**
   * The ID of the variant to add to the cart. Optional, if not provided, the product will be added without a variant.
   */
  variant?: DefaultDocumentIDType
}

export type EcommerceContextType<T extends EcommerceCollections = EcommerceCollections> = {
  /**
   * Add an item to the cart.
   */
  addItem: (item: CartItemArgument, quantity?: number) => Promise<void>
  /**
   * All current addresses for the current user.
   * This is used to manage shipping and billing addresses.
   */
  addresses?: T['addresses'][]
  /**
   * The current data of the cart.
   */
  cart?: T['addresses']
  /**
   * The ID of the current cart corresponding to the cart in the database or local storage.
   */
  cartID?: DefaultDocumentIDType
  /**
   * Clear the cart, removing all items.
   */
  clearCart: () => Promise<void>
  /**
   * Initiate a payment using the selected payment method.
   * This method should be called after the cart is ready for checkout.
   * It requires the payment method ID and any necessary payment data.
   */
  confirmOrder: (
    paymentMethodID: string,
    options?: { additionalData: Record<string, unknown> },
  ) => Promise<unknown>
  /**
   * Create a new address by providing the data.
   */
  createAddress: (data: Partial<T['addresses']>) => Promise<void>
  /**
   * The configuration for the currencies used in the ecommerce context.
   */
  currenciesConfig: CurrenciesConfig
  /**
   * The currently selected currency used for the cart and price formatting automatically.
   */
  currency: Currency
  /**
   * Decrement an item in the cart by its index ID.
   * If quantity reaches 0, the item will be removed from the cart.
   */
  decrementItem: (item: DefaultDocumentIDType) => Promise<void>
  /**
   * Increment an item in the cart by its index ID.
   */
  incrementItem: (item: DefaultDocumentIDType) => Promise<void>
  /**
   * Initiate a payment using the selected payment method.
   * This method should be called after the cart is ready for checkout.
   * It requires the payment method ID and any necessary payment data.
   */
  initiatePayment: (
    paymentMethodID: string,
    options?: { additionalData: Record<string, unknown> },
  ) => Promise<unknown>
  /**
   * Indicates whether any cart operation is currently in progress.
   * Useful for disabling buttons and preventing race conditions.
   */
  isLoading: boolean
  paymentMethods: PaymentAdapterClient[]
  /**
   * Refresh the cart.
   */
  refreshCart: () => Promise<void>
  /**
   * Remove an item from the cart by its index ID.
   */
  removeItem: (item: DefaultDocumentIDType) => Promise<void>
  /**
   * The name of the currently selected payment method.
   * This is used to determine which payment method to use when initiating a payment.
   */
  selectedPaymentMethod?: null | string
  /**
   * Change the currency for the cart, it defaults to the configured currency.
   * This will update the currency used for pricing and calculations.
   */
  setCurrency: (currency: string) => void
  /**
   * Update an address by providing the data and the ID.
   */
  updateAddress: (addressID: DefaultDocumentIDType, data: Partial<T['addresses']>) => Promise<void>
}
