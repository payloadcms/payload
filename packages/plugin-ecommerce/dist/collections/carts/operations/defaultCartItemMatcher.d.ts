import type { CartItemMatcher } from './types.js';
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
 */
export declare const defaultCartItemMatcher: CartItemMatcher;
//# sourceMappingURL=defaultCartItemMatcher.d.ts.map