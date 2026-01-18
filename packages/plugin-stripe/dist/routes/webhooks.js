import Stripe from 'stripe';
import { handleWebhooks } from '../webhooks/index.js';
export const stripeWebhooks = async (args)=>{
    const { config, pluginConfig, req } = args;
    let returnStatus = 200;
    const { stripeSecretKey, stripeWebhooksEndpointSecret, webhooks } = pluginConfig;
    if (stripeWebhooksEndpointSecret) {
        const stripe = new Stripe(stripeSecretKey, {
            // api version can only be the latest, stripe recommends ts ignoring it
            apiVersion: '2022-08-01',
            appInfo: {
                name: 'Stripe Payload Plugin',
                url: 'https://payloadcms.com'
            }
        });
        const body = await req.text();
        const stripeSignature = req.headers.get('stripe-signature');
        if (stripeSignature) {
            let event;
            try {
                event = stripe.webhooks.constructEvent(body, stripeSignature, stripeWebhooksEndpointSecret);
            } catch (err) {
                const msg = err instanceof Error ? err.message : JSON.stringify(err);
                req.payload.logger.error(`Error constructing Stripe event: ${msg}`);
                returnStatus = 400;
            }
            if (event) {
                void handleWebhooks({
                    config,
                    event,
                    payload: req.payload,
                    pluginConfig,
                    req,
                    stripe
                });
                // Fire external webhook handlers if they exist
                if (typeof webhooks === 'function') {
                    void webhooks({
                        config,
                        event,
                        payload: req.payload,
                        pluginConfig,
                        req,
                        stripe
                    });
                }
                if (typeof webhooks === 'object') {
                    const webhookEventHandler = webhooks[event.type];
                    if (typeof webhookEventHandler === 'function') {
                        void webhookEventHandler({
                            config,
                            event,
                            payload: req.payload,
                            pluginConfig,
                            req,
                            stripe
                        });
                    }
                }
            }
        }
    }
    return Response.json({
        received: true
    }, {
        status: returnStatus
    });
};

//# sourceMappingURL=webhooks.js.map