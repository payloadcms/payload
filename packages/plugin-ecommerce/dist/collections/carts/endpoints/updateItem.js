import { addDataAndFileToRequest } from 'payload';
import { updateItem } from '../operations/updateItem.js';
/**
 * Creates an endpoint handler for updating an item in a cart.
 * Supports MongoDB-style operators for flexible updates.
 *
 * Route: POST /api/{cartsSlug}/:id/update-item
 *
 * Request body:
 * - itemID: string (the cart item row ID to update)
 * - quantity: number | { $inc: number } (set or increment/decrement)
 * - removeOnZero?: boolean (defaults to true, removes item if quantity reaches 0)
 * - secret?: string (for guest cart access)
 *
 * @example
 * ```ts
 * // Set quantity to 5
 * fetch('/api/carts/123/update-item', {
 *   method: 'POST',
 *   body: JSON.stringify({ itemID: 'item-456', quantity: 5 })
 * })
 *
 * // Increment by 1
 * fetch('/api/carts/123/update-item', {
 *   method: 'POST',
 *   body: JSON.stringify({ itemID: 'item-456', quantity: { $inc: 1 } })
 * })
 *
 * // Decrement by 1
 * fetch('/api/carts/123/update-item', {
 *   method: 'POST',
 *   body: JSON.stringify({ itemID: 'item-456', quantity: { $inc: -1 } })
 * })
 * ```
 */ export const updateItemEndpoint = ({ cartsSlug })=>({
        handler: async (req)=>{
            await addDataAndFileToRequest(req);
            const cartID = req.routeParams?.id;
            const data = req.data;
            if (!cartID) {
                return Response.json({
                    message: 'Cart ID is required',
                    success: false
                }, {
                    status: 400
                });
            }
            if (!data?.itemID) {
                return Response.json({
                    message: 'Item ID is required',
                    success: false
                }, {
                    status: 400
                });
            }
            if (data?.quantity === undefined) {
                return Response.json({
                    message: 'Quantity is required',
                    success: false
                }, {
                    status: 400
                });
            }
            // Validate quantity format
            const isValidQuantity = typeof data.quantity === 'number' || typeof data.quantity === 'object' && data.quantity !== null && '$inc' in data.quantity && typeof data.quantity.$inc === 'number';
            if (!isValidQuantity) {
                return Response.json({
                    message: 'Quantity must be a number or { $inc: number }',
                    success: false
                }, {
                    status: 400
                });
            }
            const result = await updateItem({
                cartID,
                cartsSlug,
                itemID: data.itemID,
                payload: req.payload,
                quantity: data.quantity,
                removeOnZero: data.removeOnZero,
                req,
                secret: data.secret
            });
            if (!result.success) {
                return Response.json(result, {
                    status: 404
                });
            }
            return Response.json(result);
        },
        method: 'post',
        path: '/:id/update-item'
    });

//# sourceMappingURL=updateItem.js.map