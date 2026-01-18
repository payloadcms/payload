/**
 * Generates a map of collection slugs based on the sanitized plugin configuration.
 * Takes into consideration any collection overrides provided in the plugin.
 * Variant-related slugs are only included when enableVariants is true.
 */ export const getCollectionSlugMap = ({ enableVariants = false, sanitizedPluginConfig })=>{
    const defaultSlugMap = {
        addresses: 'addresses',
        carts: 'carts',
        customers: 'users',
        orders: 'orders',
        products: 'products',
        transactions: 'transactions',
        ...enableVariants ? {
            variantOptions: 'variantOptions',
            variants: 'variants',
            variantTypes: 'variantTypes'
        } : {}
    };
    const collectionSlugsMap = defaultSlugMap;
    if (typeof sanitizedPluginConfig.customers === 'object' && sanitizedPluginConfig.customers.slug) {
        collectionSlugsMap.customers = sanitizedPluginConfig.customers.slug;
    }
    // Only include variant slugs from slugMap if variants are enabled
    const slugMapOverrides = sanitizedPluginConfig.slugMap || {};
    if (!enableVariants) {
        delete slugMapOverrides.variantOptions;
        delete slugMapOverrides.variants;
        delete slugMapOverrides.variantTypes;
    }
    return {
        ...collectionSlugsMap,
        ...slugMapOverrides
    };
};

//# sourceMappingURL=getCollectionSlugMap.js.map