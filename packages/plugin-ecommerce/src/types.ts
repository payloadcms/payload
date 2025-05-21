import type { CollectionConfig, Endpoint, Field, GroupField, PayloadRequest } from 'payload'

export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]
export type CollectionOverride = { fields?: FieldsOverride } & Partial<
  Omit<CollectionConfig, 'fields'>
>

/**
 * The full payment adapter config expected as part of the config for the Ecommerce plugin.
 *
 * You can insert this type directly or return it from a function constructing it.
 */
export type PaymentAdapter = {
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
  hooks?: {
    /**
     * A hook that runs when a transaction is created. This is where you can create a transaction in the payment provider.
     *
     * For example, in Stripe, this is where you would create a PaymentIntent and make sure you return the data shape as configured in the group config adjacent.
     */
    createTransaction?: (args: {
      data: Record<string, any>
      operation: 'create'
      req: PayloadRequest
    }) => Promise<Record<string, any>> | Record<string, any>
  }
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

export type PaymentsConfig = {
  paymentMethods?: PaymentAdapter[]
  paymentRecordsCollection?: CollectionOverride
}

export type SubscriptionsConfig = {
  subscriptionsCollection?: CollectionOverride
}

export type CurrenciesConfig = {
  /**
   * Defaults to the first supported currency.
   *
   * @example 'USD'
   */
  defaultCurrency?: string
  /**
   *
   */
  supportedCurrencies: Currency[]
}

export type EcommercePluginConfig = {
  /**
   * Configure supported currencies and default settings.
   *
   * Defaults to supporting USD.
   */
  currencies?: CurrenciesConfig
  /**
   * Slug of the collection to use for customers. Referenced in places such as orders and transactions.
   *
   * @default 'users'
   */
  customersCollectionSlug?: string
  orders?: boolean | OrdersConfig
  /**
   * Enable tracking of payments. Accepts a config object to override the default collection settings.
   *
   * Defaults to true when the paymentMethods array is provided.
   */
  payments?: PaymentsConfig | true
  products?: boolean | ProductsConfig
}
