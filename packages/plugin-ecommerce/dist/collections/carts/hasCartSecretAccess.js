/**
 * Internal access function for guest cart access via secret in context or queries.
 * Only active when allowGuestCarts is enabled.
 *
 * @param allowGuestCarts - Whether guest cart access is enabled
 * @returns Access function that checks for valid cart secret in context
 */ export const hasCartSecretAccess = (allowGuestCarts)=>{
    return ({ req })=>{
        if (!allowGuestCarts) {
            return false;
        }
        const cartSecret = req.context?.cartSecret ?? req.query?.secret;
        if (!cartSecret || typeof cartSecret !== 'string') {
            return false;
        }
        return {
            secret: {
                equals: cartSecret
            }
        };
    };
};

//# sourceMappingURL=hasCartSecretAccess.js.map