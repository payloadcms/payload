import type { Config, Endpoint } from 'payload'

import { deepMergeSimple } from 'payload/shared'

import type { EcommercePluginConfig, PaymentAdapter } from './types.js'

import { USD } from './currencies/index.js'
import { confirmOrderHandler } from './endpoints/confirmOrder.js'
import { initiatePaymentHandler } from './endpoints/initiatePayment.js'
import { ordersCollection } from './orders/ordersCollection.js'
import { paymentRecordsCollection } from './payments/collection/paymentRecordsCollection.js'
import { productsCollection } from './products/productsCollection.js'
import { translations } from './translations/index.js'
import { variantOptionsCollection } from './variants/variantOptionsCollection.js'
import { variantsCollection } from './variants/variantsCollection/index.js'
import { variantTypesCollection } from './variants/variantTypesCollection.js'

export const ecommercePlugin =
  (pluginConfig?: EcommercePluginConfig) =>
  (incomingConfig: Config): Config => {
    if (!pluginConfig) {
      return incomingConfig
    }

    const customersCollectionSlug = pluginConfig.customersCollectionSlug || 'users'

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

    if (pluginConfig.products) {
      const productsConfig =
        typeof pluginConfig.products === 'boolean'
          ? {
              variants: true,
            }
          : pluginConfig.products

      if (productsConfig.variants) {
        const overrides =
          typeof productsConfig.variants === 'boolean' ? undefined : productsConfig.variants

        const variants = variantsCollection({
          currenciesConfig,
          overrides: overrides?.variantsCollection,
        })
        const variantTypes = variantTypesCollection({
          overrides: overrides?.variantTypesCollection,
        })
        const variantOptions = variantOptionsCollection({
          overrides: overrides?.variantOptionsCollection,
        })

        incomingConfig.collections.push(variants, variantTypes, variantOptions)
      }

      const products = productsCollection({
        currenciesConfig,
        enableVariants: Boolean(productsConfig.variants),
      })

      incomingConfig.collections.push(products)
    }

    if (pluginConfig.orders) {
      const orders = ordersCollection({ currenciesConfig, customersCollectionSlug })
      incomingConfig.collections.push(orders)
    }

    if (pluginConfig.payments) {
      const paymentMethods =
        typeof pluginConfig.payments === 'object' && pluginConfig.payments?.paymentMethods?.length
          ? pluginConfig.payments?.paymentMethods
          : []

      if (paymentMethods.length) {
        if (!Array.isArray(incomingConfig.endpoints)) {
          incomingConfig.endpoints = []
        }

        paymentMethods.forEach((paymentMethod) => {
          const methodPath = `/payments/${paymentMethod.name}`
          const endpoints: Endpoint[] = []

          const initiatePayment: Endpoint = {
            handler: initiatePaymentHandler({ currenciesConfig, paymentMethod }),
            method: 'post',
            path: `${methodPath}/initiate-payment`,
          }

          const confirmOrder: Endpoint = {
            handler: confirmOrderHandler({ currenciesConfig, paymentMethod }),
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

      const paymentRecords = paymentRecordsCollection({
        currenciesConfig,
        customersCollectionSlug,
        paymentMethods,
      })
      incomingConfig.collections.push(paymentRecords)
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
