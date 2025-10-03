import type { Config, Endpoint } from 'payload'

import { deepMergeSimple } from 'payload/shared'

import type { EcommercePluginConfig, SanitizedEcommercePluginConfig } from './types/index.js'

import { createAddressesCollection } from './collections/addresses/createAddressesCollection.js'
import { createCartsCollection } from './collections/carts/createCartsCollection.js'
import { createOrdersCollection } from './collections/orders/createOrdersCollection.js'
import { createProductsCollection } from './collections/products/createProductsCollection.js'
import { createTransactionsCollection } from './collections/transactions/createTransactionsCollection.js'
import { createVariantOptionsCollection } from './collections/variants/createVariantOptionsCollection.js'
import { createVariantsCollection } from './collections/variants/createVariantsCollection/index.js'
import { createVariantTypesCollection } from './collections/variants/createVariantTypesCollection.js'
import { confirmOrderHandler } from './endpoints/confirmOrder.js'
import { initiatePaymentHandler } from './endpoints/initiatePayment.js'
import { translations } from './translations/index.js'
import { getCollectionSlugMap } from './utilities/getCollectionSlugMap.js'
import { pushTypeScriptProperties } from './utilities/pushTypeScriptProperties.js'
import { sanitizePluginConfig } from './utilities/sanitizePluginConfig.js'

export const ecommercePlugin =
  (pluginConfig?: EcommercePluginConfig) =>
  async (incomingConfig: Config): Promise<Config> => {
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
      addressFields = sanitizedPluginConfig.addresses.addressFields

      const supportedCountries = sanitizedPluginConfig.addresses.supportedCountries

      const defaultAddressesCollection = createAddressesCollection({
        access: {
          adminOrCustomerOwner: accessConfig.adminOrCustomerOwner,
          authenticatedOnly: accessConfig.authenticatedOnly,
          customerOnlyFieldAccess: accessConfig.customerOnlyFieldAccess,
        },
        addressFields,
        customersSlug: collectionSlugMap.customers,
        supportedCountries,
      })

      const addressesCollection =
        sanitizedPluginConfig.addresses &&
        typeof sanitizedPluginConfig.addresses === 'object' &&
        'addressesCollectionOverride' in sanitizedPluginConfig.addresses &&
        sanitizedPluginConfig.addresses.addressesCollectionOverride
          ? await sanitizedPluginConfig.addresses.addressesCollectionOverride({
              defaultCollection: defaultAddressesCollection,
            })
          : defaultAddressesCollection

      incomingConfig.collections.push(addressesCollection)
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
        const variantsConfig =
          typeof productsConfig.variants === 'boolean' ? undefined : productsConfig.variants

        const defaultVariantsCollection = createVariantsCollection({
          access: {
            adminOnly: accessConfig.adminOnly,
            adminOrPublishedStatus: accessConfig.adminOrPublishedStatus,
          },
          currenciesConfig,
          inventory: sanitizedPluginConfig.inventory,
          productsSlug: collectionSlugMap.products,
          variantOptionsSlug: collectionSlugMap.variantOptions,
        })

        const variants =
          variantsConfig &&
          typeof variantsConfig === 'object' &&
          'variantsCollectionOverride' in variantsConfig &&
          variantsConfig.variantsCollectionOverride
            ? await variantsConfig.variantsCollectionOverride({
                defaultCollection: defaultVariantsCollection,
              })
            : defaultVariantsCollection

        const defaultVariantTypesCollection = createVariantTypesCollection({
          access: {
            adminOnly: accessConfig.adminOnly,
            publicAccess: accessConfig.publicAccess,
          },
          variantOptionsSlug: collectionSlugMap.variantOptions,
        })

        const variantTypes =
          variantsConfig &&
          typeof variantsConfig === 'object' &&
          'variantTypesCollectionOverride' in variantsConfig &&
          variantsConfig.variantTypesCollectionOverride
            ? await variantsConfig.variantTypesCollectionOverride({
                defaultCollection: defaultVariantTypesCollection,
              })
            : defaultVariantTypesCollection

        const defaultVariantOptionsCollection = createVariantOptionsCollection({
          access: {
            adminOnly: accessConfig.adminOnly,
            publicAccess: accessConfig.publicAccess,
          },
          variantTypesSlug: collectionSlugMap.variantTypes,
        })

        const variantOptions =
          variantsConfig &&
          typeof variantsConfig === 'object' &&
          'variantOptionsCollectionOverride' in variantsConfig &&
          variantsConfig.variantOptionsCollectionOverride
            ? await variantsConfig.variantOptionsCollectionOverride({
                defaultCollection: defaultVariantOptionsCollection,
              })
            : defaultVariantOptionsCollection

        incomingConfig.collections.push(variants, variantTypes, variantOptions)
      }

      const defaultProductsCollection = createProductsCollection({
        access: {
          adminOnly: accessConfig.adminOnly,
          adminOrPublishedStatus: accessConfig.adminOrPublishedStatus,
        },
        currenciesConfig,
        enableVariants,
        inventory: sanitizedPluginConfig.inventory,
        variantsSlug: collectionSlugMap.variants,
        variantTypesSlug: collectionSlugMap.variantTypes,
      })

      const productsCollection =
        productsConfig &&
        'productsCollectionOverride' in productsConfig &&
        productsConfig.productsCollectionOverride
          ? await productsConfig.productsCollectionOverride({
              defaultCollection: defaultProductsCollection,
            })
          : defaultProductsCollection

      incomingConfig.collections.push(productsCollection)

      if (sanitizedPluginConfig.carts) {
        const defaultCartsCollection = createCartsCollection({
          access: {
            adminOrCustomerOwner: accessConfig.adminOrCustomerOwner,
            publicAccess: accessConfig.publicAccess,
          },
          currenciesConfig,
          customersSlug: collectionSlugMap.customers,
          enableVariants: Boolean(productsConfig.variants),
          productsSlug: collectionSlugMap.products,
          variantsSlug: collectionSlugMap.variants,
        })

        const cartsCollection =
          sanitizedPluginConfig.carts &&
          typeof sanitizedPluginConfig.carts === 'object' &&
          'cartsCollectionOverride' in sanitizedPluginConfig.carts &&
          sanitizedPluginConfig.carts.cartsCollectionOverride
            ? await sanitizedPluginConfig.carts.cartsCollectionOverride({
                defaultCollection: defaultCartsCollection,
              })
            : defaultCartsCollection

        incomingConfig.collections.push(cartsCollection)
      }
    }

    if (sanitizedPluginConfig.orders) {
      const defaultOrdersCollection = createOrdersCollection({
        access: {
          adminOnly: accessConfig.adminOnly,
          adminOnlyFieldAccess: accessConfig.adminOnlyFieldAccess,
          adminOrCustomerOwner: accessConfig.adminOrCustomerOwner,
        },
        addressFields,
        currenciesConfig,
        customersSlug: collectionSlugMap.customers,
        enableVariants,
        productsSlug: collectionSlugMap.products,
        variantsSlug: collectionSlugMap.variants,
      })

      const ordersCollection =
        sanitizedPluginConfig.orders &&
        typeof sanitizedPluginConfig.orders === 'object' &&
        'ordersCollectionOverride' in sanitizedPluginConfig.orders &&
        sanitizedPluginConfig.orders.ordersCollectionOverride
          ? await sanitizedPluginConfig.orders.ordersCollectionOverride({
              defaultCollection: defaultOrdersCollection,
            })
          : defaultOrdersCollection

      incomingConfig.collections.push(ordersCollection)
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
      const defaultTransactionsCollection = createTransactionsCollection({
        access: {
          adminOnly: accessConfig.adminOnly,
        },
        addressFields,
        cartsSlug: collectionSlugMap.carts,
        currenciesConfig,
        customersSlug: collectionSlugMap.customers,
        enableVariants,
        ordersSlug: collectionSlugMap.orders,
        paymentMethods,
        productsSlug: collectionSlugMap.products,
        variantsSlug: collectionSlugMap.variants,
      })

      const transactionsCollection =
        sanitizedPluginConfig.transactions &&
        typeof sanitizedPluginConfig.transactions === 'object' &&
        'transactionsCollectionOverride' in sanitizedPluginConfig.transactions &&
        sanitizedPluginConfig.transactions.transactionsCollectionOverride
          ? await sanitizedPluginConfig.transactions.transactionsCollectionOverride({
              defaultCollection: defaultTransactionsCollection,
            })
          : defaultTransactionsCollection

      incomingConfig.collections.push(transactionsCollection)
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

    if (!incomingConfig.typescript) {
      incomingConfig.typescript = {}
    }

    if (!incomingConfig.typescript.schema) {
      incomingConfig.typescript.schema = []
    }

    incomingConfig.typescript.schema.push((args) =>
      pushTypeScriptProperties({
        ...args,
        collectionSlugMap,
        sanitizedPluginConfig,
      }),
    )

    return incomingConfig
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
