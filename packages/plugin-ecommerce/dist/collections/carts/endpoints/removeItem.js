import { addDataAndFileToRequest } from 'payload';
import { removeItem } from '../operations/removeItem.js';
/**
 * Creates an endpoint handler for removing items from a cart.
 *
 * Route: POST /api/{cartsSlug}/:id/remove-item
 *
 * Request body:
 * - itemID: string (the cart item row ID to remove)
 * - secret?: string (for guest cart access)
 */ export const removeItemEndpoint = ({ cartsSlug })=>({
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
            const result = await removeItem({
                cartID,
                cartsSlug,
                itemID: data.itemID,
                payload: req.payload,
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
        path: '/:id/remove-item'
    });

//# sourceMappingURL=removeItem.js.map