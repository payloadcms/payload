import { addDataAndFileToRequest, Forbidden } from 'payload';
import { stripeProxy } from '../utilities/stripeProxy.js';
export const stripeREST = async (args)=>{
    let responseStatus = 200;
    let responseJSON;
    const { pluginConfig, req } = args;
    await addDataAndFileToRequest(req);
    const requestWithData = req;
    const { data, payload, user } = requestWithData;
    const { stripeSecretKey } = pluginConfig;
    try {
        if (!user) {
            // TODO: make this customizable from the config
            throw new Forbidden(req.t);
        }
        responseJSON = await stripeProxy({
            stripeArgs: data?.stripeArgs,
            stripeMethod: data?.stripeMethod,
            stripeSecretKey
        });
        const { status } = responseJSON;
        responseStatus = status;
    } catch (error) {
        const message = `An error has occurred in the Stripe plugin REST handler: '${JSON.stringify(error)}'`;
        payload.logger.error(message);
        responseStatus = 500;
        responseJSON = {
            message
        };
    }
    return Response.json(responseJSON, {
        status: responseStatus
    });
};

//# sourceMappingURL=rest.js.map