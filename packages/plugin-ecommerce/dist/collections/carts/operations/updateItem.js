import { createRequestWithSecret } from './createRequestWithSecret.js';
import { isNumericOperator } from './types.js';
/**
 * Updates an item in the cart using MongoDB-style operators.
 *
 * This handler is isolated and can be used from:
 * - Custom endpoints
 * - Local API operations
 * - Hooks
 *
 * @example
 * ```ts
 * // Set quantity to 5
 * const result = await updateItem({
 *   payload,
 *   cartsSlug: 'carts',
 *   cartID: '123',
 *   itemID: 'item-row-id',
 *   quantity: 5,
 * })
 *
 * // Increment by 1
 * const result = await updateItem({
 *   payload,
 *   cartsSlug: 'carts',
 *   cartID: '123',
 *   itemID: 'item-row-id',
 *   quantity: { $inc: 1 },
 * })
 *
 * // Decrement by 2
 * const result = await updateItem({
 *   payload,
 *   cartsSlug: 'carts',
 *   cartID: '123',
 *   itemID: 'item-row-id',
 *   quantity: { $inc: -2 },
 * })
 * ```
 */ export const updateItem = async (args)=>{
    const { cartID, cartsSlug, itemID, payload, quantity, removeOnZero = true, req, secret } = args;
    // Inject secret into request context for access control
    const reqWithSecret = createRequestWithSecret(req, secret);
    const cart = await payload.findByID({
        id: cartID,
        collection: cartsSlug,
        depth: 0,
        overrideAccess: false,
        req: reqWithSecret
    });
    if (!cart) {
        return {
            cart: null,
            message: `Cart with ID ${cartID} not found`,
            success: false
        };
    }
    const existingItems = cart.items || [];
    // Find the item by its row ID
    const itemIndex = existingItems.findIndex((item)=>item.id === itemID);
    if (itemIndex === -1) {
        return {
            cart,
            message: `Item with ID ${itemID} not found in cart`,
            success: false
        };
    }
    const updatedItems = [
        ...existingItems
    ];
    const existingItem = updatedItems[itemIndex];
    const currentQuantity = existingItem.quantity;
    // Calculate new quantity based on operator or direct value
    let newQuantity;
    if (isNumericOperator(quantity)) {
        // $inc operator: add to current value
        newQuantity = currentQuantity + quantity.$inc;
    } else {
        // Direct value: set to this value
        newQuantity = quantity;
    }
    if (newQuantity <= 0 && removeOnZero) {
        // Remove the item if quantity reaches 0 or below
        updatedItems.splice(itemIndex, 1);
    } else {
        // Update the quantity (minimum 1 if not removing on zero)
        updatedItems[itemIndex] = {
            ...existingItem,
            quantity: removeOnZero ? newQuantity : Math.max(1, newQuantity)
        };
    }
    const updatedCart = await payload.update({
        id: cartID,
        collection: cartsSlug,
        data: {
            items: updatedItems
        },
        depth: 0,
        overrideAccess: false,
        req: reqWithSecret
    });
    const wasRemoved = newQuantity <= 0 && removeOnZero;
    return {
        cart: updatedCart,
        message: wasRemoved ? 'Item removed from cart' : 'Item quantity updated',
        success: true
    };
};

//# sourceMappingURL=updateItem.js.map