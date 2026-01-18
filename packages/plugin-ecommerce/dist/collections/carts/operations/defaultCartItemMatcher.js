/**
 * Default cart item matcher that considers items identical if they have
 * the same product ID and variant ID.
 *
 * Users can provide a custom matcher to add additional criteria such as
 * delivery options, customizations, or other item-specific properties.
 *
 * @example
 * ```ts
 * // Extend the default matcher to include a delivery option
 * const customMatcher: CartItemMatcher = ({ existingItem, newItem }) => {
 *   const defaultMatch = defaultCartItemMatcher({ existingItem, newItem })
 *   return defaultMatch && existingItem.deliveryOption === newItem.deliveryOption
 * }
 * ```
 */ export const defaultCartItemMatcher = ({ existingItem, newItem })=>{
    const existingProductID = typeof existingItem.product === 'object' ? existingItem.product.id : existingItem.product;
    const existingVariantID = existingItem.variant && typeof existingItem.variant === 'object' ? existingItem.variant.id : existingItem.variant;
    const productMatches = existingProductID === newItem.product;
    // Variant matching: both must have same variant or both must have no variant
    const variantMatches = newItem.variant ? existingVariantID === newItem.variant : !existingVariantID;
    return productMatches && variantMatches;
};

//# sourceMappingURL=defaultCartItemMatcher.js.map