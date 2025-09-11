import type { Config, Endpoint } from 'payload'

import { deepMergeSimple } from 'payload/shared'

import type { EcommercePluginConfig, SanitizedEcommercePluginConfig } from './types.js'

import { createAddressesCollection } from './collections/addresses/createAddressesCollection.js'
import { createCartsCollection } from './collections/carts/createCartsCollection.js'
import { createOrdersCollection } from './collections/orders/createOrdersCollection.js'
import { createProductsCollection } from './collections/products/createProductsCollection.js'
import { createVariantOptionsCollection } from './collections/variants/createVariantOptionsCollection.js'
import { createVariantsCollection } from './collections/variants/createVariantsCollection/index.js'
import { createVariantTypesCollection } from './collections/variants/createVariantTypesCollection.js'
import { confirmOrderHandler } from './endpoints/confirmOrder.js'
import { initiatePaymentHandler } from './endpoints/initiatePayment.js'
import { createTransactionsCollection } from './transactions/createTransactionsCollection.js'
import { translations } from './translations/index.js'
import { getCollectionSlugMap } from './utilities/getCollectionSlugMap.js'
import { sanitizePluginConfig } from './utilities/sanitizePluginConfig.js'

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

    const accessConfig = sanitizedPluginConfig.access

    // Ensure collections exists
    if (!incomingConfig.collections) {
      incomingConfig.collections = []
    }

    // Controls whether variants are enabled in the plugin. This is toggled to true under products config
    let enableVariants = false

    const currenciesConfig: Required<SanitizedEcommercePluginConfig['currencies']> =
      sanitizedPluginConfig.currencies

    let addressFields

    if (sanitizedPluginConfig.addresses) {
      const collectionOverrides =
        typeof sanitizedPluginConfig.addresses === 'object'
          ? sanitizedPluginConfig.addresses.collectionOverride
          : undefined

      addressFields = sanitizedPluginConfig.addresses.addressFields

      const supportedCountries = sanitizedPluginConfig.addresses.supportedCountries

      const addresses = createAddressesCollection({
        access: {
          adminOrCustomerOwner: accessConfig.adminOrCustomerOwner,
          authenticatedOnly: accessConfig.authenticatedOnly,
          customerOnlyFieldAccess: accessConfig.customerOnlyFieldAccess,
        },
        addressFields,
        customersSlug: collectionSlugMap.customers,
        overrides: collectionOverrides,
        supportedCountries,
      })

      incomingConfig.collections.push(addresses)
    }

    if (sanitizedPluginConfig.products) {
      const productsConfig =
        typeof sanitizedPluginConfig.products === 'boolean'
          ? {
              variants: true,
            }
          : sanitizedPluginConfig.products

      enableVariants = Boolean(productsConfig.variants)

      if (productsConfig.variants) {
        const overrides =
          typeof productsConfig.variants === 'boolean' ? undefined : productsConfig.variants

        const variants = createVariantsCollection({
          access: {
            adminOnly: accessConfig.adminOnly,
            adminOrPublishedStatus: accessConfig.adminOrPublishedStatus,
          },
          currenciesConfig,
          inventory: sanitizedPluginConfig.inventory,
          overrides: overrides?.variantsCollection,
          productsSlug: collectionSlugMap.products,
          variantOptionsSlug: collectionSlugMap.variantOptions,
        })

        const variantTypes = createVariantTypesCollection({
          access: {
            adminOnly: accessConfig.adminOnly,
            publicAccess: accessConfig.publicAccess,
          },
          overrides: overrides?.variantTypesCollection,
          variantOptionsSlug: collectionSlugMap.variantOptions,
        })

        const variantOptions = createVariantOptionsCollection({
          access: {
            adminOnly: accessConfig.adminOnly,
            publicAccess: accessConfig.publicAccess,
          },
          overrides: overrides?.variantOptionsCollection,
          variantTypesSlug: collectionSlugMap.variantTypes,
        })

        incomingConfig.collections.push(variants, variantTypes, variantOptions)
      }

      const products = createProductsCollection({
        currenciesConfig,
        enableVariants,
        inventory: sanitizedPluginConfig.inventory,
        variantsSlug: collectionSlugMap.variants,
        variantTypesSlug: collectionSlugMap.variantTypes,
        ...('productsCollection' in productsConfig && productsConfig.productsCollection
          ? { overrides: productsConfig.productsCollection }
          : {}),
        access: {
          adminOnly: accessConfig.adminOnly,
          adminOrPublishedStatus: accessConfig.adminOrPublishedStatus,
        },
      })

      incomingConfig.collections.push(products)

      if (sanitizedPluginConfig.carts) {
        const carts = createCartsCollection({
          access: {
            adminOrCustomerOwner: accessConfig.adminOrCustomerOwner,
            publicAccess: accessConfig.publicAccess,
          },
          currenciesConfig,
          customersSlug: collectionSlugMap.customers,
          enableVariants: Boolean(productsConfig.variants),
          overrides:
            sanitizedPluginConfig.carts === true
              ? undefined
              : sanitizedPluginConfig.carts.cartsCollection,
          productsSlug: collectionSlugMap.products,
          variantsSlug: collectionSlugMap.variants,
        })

        incomingConfig.collections.push(carts)
      }
    }

    if (sanitizedPluginConfig.orders) {
      const orders = createOrdersCollection({
        access: {
          adminOnly: accessConfig.adminOnly,
          adminOnlyFieldAccess: accessConfig.adminOnlyFieldAccess,
          adminOrCustomerOwner: accessConfig.adminOrCustomerOwner,
        },
        addressFields,
        currenciesConfig,
        customersSlug: collectionSlugMap.customers,
        enableVariants,
        overrides:
          sanitizedPluginConfig.orders === true
            ? undefined
            : sanitizedPluginConfig.orders.ordersCollection,
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

        const productsValidation =
          (typeof sanitizedPluginConfig.products === 'object' &&
            sanitizedPluginConfig.products.validation) ||
          undefined

        paymentMethods.forEach((paymentMethod) => {
          const methodPath = `/payments/${paymentMethod.name}`
          const endpoints: Endpoint[] = []

          const initiatePayment: Endpoint = {
            handler: initiatePaymentHandler({
              currenciesConfig,
              inventory: sanitizedPluginConfig.inventory,
              paymentMethod,
              productsSlug: collectionSlugMap.products,
              productsValidation,
              transactionsSlug: collectionSlugMap.transactions,
              variantsSlug: collectionSlugMap.variants,
            }),
            method: 'post',
            path: `${methodPath}/initiate`,
          }

          const confirmOrder: Endpoint = {
            handler: confirmOrderHandler({
              cartsSlug: collectionSlugMap.carts,
              currenciesConfig,
              ordersSlug: collectionSlugMap.orders,
              paymentMethod,
              productsValidation,
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
      const transactions = createTransactionsCollection({
        access: {
          adminOnly: accessConfig.adminOnly,
        },
        addressFields,
        cartsSlug: collectionSlugMap.carts,
        currenciesConfig,
        customersSlug: collectionSlugMap.customers,
        enableVariants,
        ordersSlug: collectionSlugMap.orders,
        overrides:
          sanitizedPluginConfig.transactions === true
            ? undefined
            : sanitizedPluginConfig.transactions.transactionsCollection,
        paymentMethods,
        productsSlug: collectionSlugMap.products,
        variantsSlug: collectionSlugMap.variants,
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

export {
  createAddressesCollection,
  createCartsCollection,
  createOrdersCollection,
  createProductsCollection,
  createTransactionsCollection,
  createVariantOptionsCollection,
  createVariantsCollection,
  createVariantTypesCollection,
}

export { EUR, GBP, USD } from './currencies/index.js'
export { amountField } from './fields/amountField.js'
export { currencyField } from './fields/currencyField.js'
export { pricesField } from './fields/pricesField.js'
export { statusField } from './fields/statusField.js'
export { variantsFields } from './fields/variantsFields.js'
