import { addDataAndFileToRequest } from 'payload';
import { mergeCart } from '../operations/mergeCart.js';
/**
 * Creates an endpoint handler for merging a guest cart into the authenticated user's cart.
 * This is used when a guest with an existing cart logs in.
 *
 * Route: POST /api/{cartsSlug}/:id/merge
 *
 * Request body:
 * - sourceCartID: string - The ID of the guest cart to merge from
 * - sourceSecret: string - The secret of the guest cart for verification
 *
 * Requires authentication - the :id in the URL is the target cart which must belong to the user.
 */ export const mergeCartEndpoint = ({ cartItemMatcher, cartsSlug })=>({
        handler: async (req)=>{
            // This endpoint requires authentication
            if (!req.user) {
                return Response.json({
                    message: 'Authentication required',
                    success: false
                }, {
                    status: 401
                });
            }
            await addDataAndFileToRequest(req);
            const targetCartID = req.routeParams?.id;
            const data = req.data;
            if (!targetCartID) {
                return Response.json({
                    message: 'Target cart ID is required',
                    success: false
                }, {
                    status: 400
                });
            }
            if (!data?.sourceCartID) {
                return Response.json({
                    message: 'Source cart ID is required',
                    success: false
                }, {
                    status: 400
                });
            }
            if (!data?.sourceSecret) {
                return Response.json({
                    message: 'Source cart secret is required',
                    success: false
                }, {
                    status: 400
                });
            }
            const result = await mergeCart({
                cartItemMatcher,
                cartsSlug,
                payload: req.payload,
                req,
                sourceCartID: data.sourceCartID,
                sourceSecret: data.sourceSecret,
                targetCartID
            });
            if (!result.success) {
                return Response.json(result, {
                    status: 404
                });
            }
            return Response.json(result);
        },
        method: 'post',
        path: '/:id/merge'
    });

//# sourceMappingURL=mergeCart.js.map