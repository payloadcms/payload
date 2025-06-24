import type { Config, Endpoint } from 'payload'

import { deepMergeSimple } from 'payload/shared'

import type { EcommercePluginConfig, SanitizedEcommercePluginConfig } from './types.js'

import { cartsCollection } from './carts/cartsCollection.js'
import { confirmOrderHandler } from './endpoints/confirmOrder.js'
import { initiatePaymentHandler } from './endpoints/initiatePayment.js'
import { cartItemsField } from './fields/cartItemsField.js'
import { ordersCollection } from './orders/ordersCollection.js'
import { productsCollection } from './products/productsCollection.js'
import { transactionsCollection } from './transactions/transactionsCollection.js'
import { translations } from './translations/index.js'
import { getCollectionSlugMap } from './utilities/getCollectionSlugMap.js'
import { sanitizePluginConfig } from './utilities/sanitizePluginConfig.js'
import { variantOptionsCollection } from './variants/variantOptionsCollection.js'
import { variantsCollection } from './variants/variantsCollection/index.js'
import { variantTypesCollection } from './variants/variantTypesCollection.js'

export const ecommercePlugin =
  (pluginConfig?: EcommercePluginConfig) =>
  (incomingConfig: Config): Config => {
    if (!pluginConfig) {
      return incomingConfig
    }

    const sanitizedPluginConfig = sanitizePluginConfig({ pluginConfig })
    /**
     * Used to keep track of the slugs of collections in case they are overridden by the user.
     */
    const collectionSlugMap = getCollectionSlugMap({ sanitizedPluginConfig })

    // Ensure collections exists
    if (!incomingConfig.collections) {
      incomingConfig.collections = []
    }

    const currenciesConfig: Required<SanitizedEcommercePluginConfig['currencies']> =
      sanitizedPluginConfig.currencies

    if (sanitizedPluginConfig.products) {
      const productsConfig =
        typeof sanitizedPluginConfig.products === 'boolean'
          ? {
              variants: true,
            }
          : sanitizedPluginConfig.products

      if (productsConfig.variants) {
        const overrides =
          typeof productsConfig.variants === 'boolean' ? undefined : productsConfig.variants

        const variants = variantsCollection({
          currenciesConfig,
          inventory: sanitizedPluginConfig.inventory,
          overrides: overrides?.variantsCollection,
          productsSlug: collectionSlugMap.products,
          variantOptionsSlug: collectionSlugMap.variantOptions,
        })

        const variantTypes = variantTypesCollection({
          overrides: overrides?.variantTypesCollection,
          variantOptionsSlug: collectionSlugMap.variantOptions,
        })

        const variantOptions = variantOptionsCollection({
          overrides: overrides?.variantOptionsCollection,
          variantTypesSlug: collectionSlugMap.variantTypes,
        })

        incomingConfig.collections.push(variants, variantTypes, variantOptions)
      }

      const products = productsCollection({
        currenciesConfig,
        enableVariants: Boolean(productsConfig.variants),
        inventory: sanitizedPluginConfig.inventory,
        ...('productsCollection' in productsConfig && productsConfig.productsCollection
          ? { overrides: productsConfig.productsCollection }
          : {}),

        variantsSlug: collectionSlugMap.variants,
        variantTypesSlug: collectionSlugMap.variantTypes,
      })

      incomingConfig.collections.push(products)
    }

    if (sanitizedPluginConfig.carts) {
      const carts = cartsCollection({
        currenciesConfig,
        customersSlug: collectionSlugMap.customers,
        overrides:
          sanitizedPluginConfig.carts === true
            ? undefined
            : sanitizedPluginConfig.carts.cartsCollection,
        productsSlug: collectionSlugMap.products,
        variantsSlug: collectionSlugMap.variants,
      })

      incomingConfig.collections.push(carts)
    }

    if (sanitizedPluginConfig.orders) {
      const orders = ordersCollection({
        currenciesConfig,
        customersSlug: collectionSlugMap.customers,
        productsSlug: collectionSlugMap.products,
        variantsSlug: collectionSlugMap.variants,
      })
      incomingConfig.collections.push(orders)
    }

    const paymentMethods = sanitizedPluginConfig.payments.paymentMethods

    if (sanitizedPluginConfig.payments) {
      if (paymentMethods.length) {
        if (!Array.isArray(incomingConfig.endpoints)) {
          incomingConfig.endpoints = []
        }

        paymentMethods.forEach((paymentMethod) => {
          const methodPath = `/payments/${paymentMethod.name}`
          const endpoints: Endpoint[] = []

          const initiatePayment: Endpoint = {
            handler: initiatePaymentHandler({
              currenciesConfig,
              inventory: sanitizedPluginConfig.inventory,
              paymentMethod,
              productsSlug: collectionSlugMap.products,
              transactionsSlug: collectionSlugMap.transactions,
              variantsSlug: collectionSlugMap.variants,
            }),
            method: 'post',
            path: `${methodPath}/initiate`,
          }

          const confirmOrder: Endpoint = {
            handler: confirmOrderHandler({
              ordersSlug: collectionSlugMap.orders,
              paymentMethod,
              transactionsSlug: collectionSlugMap.transactions,
            }),
            method: 'post',
            path: `${methodPath}/confirm-order`,
          }

          endpoints.push(initiatePayment, confirmOrder)

          // Attach any additional endpoints defined in the payment method
          if (paymentMethod.endpoints && paymentMethod.endpoints.length > 0) {
            const methodEndpoints = paymentMethod.endpoints.map((endpoint) => {
              const path = endpoint.path.startsWith('/') ? endpoint.path : `/${endpoint.path}`

              return {
                ...endpoint,
                path: `${methodPath}${path}`,
              }
            })

            endpoints.push(...methodEndpoints)
          }

          incomingConfig.endpoints!.push(...endpoints)
        })
      }
    }

    if (sanitizedPluginConfig.transactions) {
      const transactions = transactionsCollection({
        currenciesConfig,
        customersSlug: collectionSlugMap.customers,
        ordersSlug: collectionSlugMap.orders,
        paymentMethods,
      })

      incomingConfig.collections.push(transactions)
    }

    if (!incomingConfig.i18n) {
      incomingConfig.i18n = {}
    }

    if (!incomingConfig.i18n?.translations) {
      incomingConfig.i18n.translations = {}
    }

    incomingConfig.i18n.translations = deepMergeSimple(
      translations,
      incomingConfig.i18n?.translations,
    )

    if (!incomingConfig.endpoints) {
      incomingConfig.endpoints = []
    }

    incomingConfig.collections.map((collection) => {
      if (collection.slug === collectionSlugMap.customers) {
        collection.fields.push(cartItemsField({ overrides: { name: 'cart' } }))
      }

      return collection
    })

    // incomingConfig.typescript = {
    //   ...incomingConfig.typescript,
    //   schema: [
    //     ({ jsonSchema }) => {
    //       if (jsonSchema.definitions) {
    //         const supportedCurrencies = pluginConfig.currencies?.supportedCurrencies || []
    //         const defaultCurrency = pluginConfig.currencies?.defaultCurrency || 'USD'

    //         // Generate JSON Schema4 for supported currencies

    //         const currenciesSchema = {
    //           type: 'array',
    //           description: 'A list of supported currency codes.',
    //           items: {
    //             type: 'string',
    //             enum: (supportedCurrencies || []).map((currency) => currency.code),
    //           },
    //           title: 'Supported Currencies',
    //         }

    //         console.log({ defs: jsonSchema.definitions })

    //         jsonSchema.definitions.SupportedCurrencies = currenciesSchema
    //       }

    //       return jsonSchema
    //     },
    //   ],
    // }

    return {
      ...incomingConfig,
    }
  }
