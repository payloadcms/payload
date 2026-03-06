import type { CollectionSlugMap, SanitizedEcommercePluginConfig } from '../types/index.js'

type Props = {
  enableVariants?: boolean
  sanitizedPluginConfig: SanitizedEcommercePluginConfig
}

/**
 * Generates a map of collection slugs based on the sanitized plugin configuration.
 * Takes into consideration any collection overrides provided in the plugin.
 * Variant-related slugs are only included when enableVariants is true.
 */
export const getCollectionSlugMap = ({
  enableVariants = false,
  sanitizedPluginConfig,
}: Props): CollectionSlugMap => {
  const defaultSlugMap: CollectionSlugMap = {
    addresses: 'addresses',
    carts: 'carts',
    customers: 'users',
    orders: 'orders',
    products: 'products',
    transactions: 'transactions',
    ...(enableVariants
      ? {
          variantOptions: 'variantOptions',
          variants: 'variants',
          variantTypes: 'variantTypes',
        }
      : {}),
  }

  const collectionSlugsMap: CollectionSlugMap = defaultSlugMap

  if (typeof sanitizedPluginConfig.customers === 'object' && sanitizedPluginConfig.customers.slug) {
    collectionSlugsMap.customers = sanitizedPluginConfig.customers.slug
  }

  // Only include variant slugs from slugMap if variants are enabled
  const slugMapOverrides = sanitizedPluginConfig.slugMap || {}

  if (!enableVariants) {
    delete slugMapOverrides.variantOptions
    delete slugMapOverrides.variants
    delete slugMapOverrides.variantTypes
  }

  return { ...collectionSlugsMap, ...slugMapOverrides }
}
