import type { CollectionSlugMap, SanitizedEcommercePluginConfig } from '../types.js'

type Props = {
  sanitizedPluginConfig: SanitizedEcommercePluginConfig
}

/**
 * Generates a map of collection slugs based on the sanitized plugin configuration.
 * Takes into consideration any collection overrides provided in the plugin.
 */
export const getCollectionSlugMap = ({ sanitizedPluginConfig }: Props): CollectionSlugMap => {
  const defaultSlugMap: CollectionSlugMap = {
    addresses: 'addresses',
    carts: 'carts',
    customers: 'users',
    orders: 'orders',
    products: 'products',
    transactions: 'transactions',
    variantOptions: 'variantOptions',
    variants: 'variants',
    variantTypes: 'variantTypes',
  }

  const collectionSlugsMap: CollectionSlugMap = {
    ...defaultSlugMap,
  }

  if (typeof sanitizedPluginConfig.customers === 'object' && sanitizedPluginConfig.customers.slug) {
    collectionSlugsMap.customers = sanitizedPluginConfig.customers.slug

    if (
      typeof sanitizedPluginConfig.addresses === 'object' &&
      sanitizedPluginConfig.addresses.collectionOverride?.slug
    ) {
      collectionSlugsMap.addresses = sanitizedPluginConfig.addresses.collectionOverride.slug
    }
  }

  if (
    typeof sanitizedPluginConfig.orders === 'object' &&
    sanitizedPluginConfig.orders.ordersCollection?.slug
  ) {
    collectionSlugsMap.orders = sanitizedPluginConfig.orders.ordersCollection.slug
  }

  if (typeof sanitizedPluginConfig.products === 'object') {
    if (sanitizedPluginConfig.products.productsCollection?.slug) {
      collectionSlugsMap.products = sanitizedPluginConfig.products.productsCollection.slug
    }

    if (typeof sanitizedPluginConfig.products.variants === 'object') {
      if (sanitizedPluginConfig.products.variants.variantsCollection?.slug) {
        collectionSlugsMap.variants =
          sanitizedPluginConfig.products.variants.variantsCollection.slug
      }

      if (sanitizedPluginConfig.products.variants.variantOptionsCollection?.slug) {
        collectionSlugsMap.variantOptions =
          sanitizedPluginConfig.products.variants.variantOptionsCollection.slug
      }

      if (sanitizedPluginConfig.products.variants.variantTypesCollection?.slug) {
        collectionSlugsMap.variantTypes =
          sanitizedPluginConfig.products.variants.variantTypesCollection.slug
      }
    }
  }

  if (
    typeof sanitizedPluginConfig.transactions === 'object' &&
    sanitizedPluginConfig.transactions.transactionsCollection?.slug
  ) {
    collectionSlugsMap.transactions = sanitizedPluginConfig.transactions.transactionsCollection.slug
  }

  if (
    typeof sanitizedPluginConfig.carts === 'object' &&
    sanitizedPluginConfig.carts.cartsCollection?.slug
  ) {
    collectionSlugsMap.carts = sanitizedPluginConfig.carts.cartsCollection.slug
  }

  return collectionSlugsMap
}
