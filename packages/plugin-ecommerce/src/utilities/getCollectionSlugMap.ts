import type { CollectionSlugMap, SanitizedEcommercePluginConfig } from '../types/index.js'

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

  const collectionSlugsMap: CollectionSlugMap = defaultSlugMap

  if (typeof sanitizedPluginConfig.customers === 'object' && sanitizedPluginConfig.customers.slug) {
    collectionSlugsMap.customers = sanitizedPluginConfig.customers.slug
  }

  return { ...collectionSlugsMap, ...(sanitizedPluginConfig.slugMap || {}) }
}
