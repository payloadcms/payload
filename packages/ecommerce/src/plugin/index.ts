import type { Config } from 'payload'

import { deepMergeSimple } from 'payload/shared'

import type { EcommercePluginConfig, PaymentAdapter } from '../types.js'

import { USD } from '../currencies/index.js'
import { ordersCollection } from '../orders/ordersCollection.js'
import { productsCollection } from '../products/productsCollection.js'
import { transactionsCollection } from '../transactions/transactionsCollection.js'
import { translations } from '../translations/index.js'
import { variantOptionsCollection } from '../variants/variantOptionsCollection.js'
import { variantsCollection } from '../variants/variantsCollection/index.js'
import { variantTypesCollection } from '../variants/variantTypesCollection.js'

export const ecommercePlugin =
  (pluginConfig?: EcommercePluginConfig) =>
  (incomingConfig: Config): Config => {
    if (!pluginConfig) {
      return incomingConfig
    }

    const customersCollectionSlug = pluginConfig.customersCollectionSlug || 'users'

    if (pluginConfig.paymentMethods?.length && pluginConfig.paymentMethods.length > 0) {
      pluginConfig.paymentMethods.forEach((method) => {
        if (method.endpoints && method.endpoints.length > 0) {
          const endpoints = method.endpoints.map((endpoint) => {
            const path = endpoint.path.startsWith('/') ? endpoint.path : `/${endpoint.path}`

            return {
              ...endpoint,
              path: `/payments/${method.name}${path}`,
            }
          })

          incomingConfig.endpoints!.push(...endpoints)
        }
      })
    }

    // Ensure collections exists
    if (!incomingConfig.collections) {
      incomingConfig.collections = []
    }

    const currenciesConfig: NonNullable<EcommercePluginConfig['currencies']> =
      pluginConfig.currencies ?? {
        defaultCurrency: 'USD',
        supportedCurrencies: [USD],
      }

    if (!currenciesConfig.defaultCurrency) {
      currenciesConfig.defaultCurrency = currenciesConfig.supportedCurrencies[0]?.code
    }

    if (pluginConfig.variants) {
      const overrides =
        typeof pluginConfig.variants === 'boolean' ? undefined : pluginConfig.variants

      const variants = variantsCollection({
        currenciesConfig,
        overrides: overrides?.variantsCollection,
      })
      const variantTypes = variantTypesCollection({ overrides: overrides?.variantTypesCollection })
      const variantOptions = variantOptionsCollection({
        overrides: overrides?.variantOptionsCollection,
      })

      incomingConfig.collections.push(variants, variantTypes, variantOptions)
    }

    if (pluginConfig.products) {
      const products = productsCollection({
        currenciesConfig,
        enableVariants: Boolean(pluginConfig.variants),
      })

      incomingConfig.collections.push(products)
    }

    if (pluginConfig.orders) {
      const orders = ordersCollection({ currenciesConfig, customersCollectionSlug })
      incomingConfig.collections.push(orders)
    }

    if (pluginConfig.transactions) {
      const transactions = transactionsCollection({
        currenciesConfig,
        customersCollectionSlug,
        paymentMethods: pluginConfig.paymentMethods,
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

    return {
      ...incomingConfig,
    }
  }
