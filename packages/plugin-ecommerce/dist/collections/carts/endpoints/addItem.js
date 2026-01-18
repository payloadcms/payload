import { addDataAndFileToRequest } from 'payload';
import { addItem } from '../operations/addItem.js';
/**
 * Creates an endpoint handler for adding items to a cart.
 *
 * Route: POST /api/{cartsSlug}/:id/add-item
 *
 * Request body:
 * - item: { product: string, variant?: string, ...customFields }
 * - quantity?: number (defaults to 1)
 * - secret?: string (for guest cart access)
 */ export const addItemEndpoint = ({ cartItemMatcher, cartsSlug })=>({
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
            if (!data?.item?.product) {
                return Response.json({
                    message: 'Item with product ID is required',
                    success: false
                }, {
                    status: 400
                });
            }
            const result = await addItem({
                cartID,
                cartItemMatcher,
                cartsSlug,
                item: data.item,
                payload: req.payload,
                quantity: data.quantity,
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
        path: '/:id/add-item'
    });

//# sourceMappingURL=addItem.js.map