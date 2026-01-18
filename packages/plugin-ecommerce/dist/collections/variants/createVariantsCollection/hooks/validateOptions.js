export const validateOptions = (props)=>async (values, { data, req })=>{
        const { productsCollectionSlug = 'products' } = props || {};
        const { t } = req;
        if (!values || values.length === 0) {
            // @ts-expect-error - TODO: Fix types
            return t('ecommerce:variantOptionsRequired');
        }
        const productID = data.product;
        if (!productID) {
            // @ts-expect-error - TODO: Fix types
            return t('ecommerce:productRequired');
        }
        const product = await req.payload.findByID({
            id: productID,
            collection: productsCollectionSlug,
            depth: 1,
            joins: {
                variants: {
                    where: {
                        ...data.id && {
                            id: {
                                not_equals: data.id
                            }
                        }
                    }
                }
            },
            select: {
                variants: true,
                variantTypes: true
            },
            user: req.user
        });
        // @ts-expect-error - TODO: Fix types
        const variants = product.variants?.docs ?? [];
        // @ts-expect-error - TODO: Fix types
        if (values.length < product?.variantTypes?.length) {
            // @ts-expect-error - TODO: Fix types
            return t('ecommerce:variantOptionsRequiredAll');
        }
        if (variants.length > 0) {
            const existingOptions = [];
            variants.forEach((variant)=>{
                existingOptions.push(variant.options);
            });
            const exists = existingOptions.some((combo)=>combo.length === values.length && combo.every((val)=>values.includes(val)));
            if (exists) {
                // @ts-expect-error - TODO: Fix types
                return t('ecommerce:variantOptionsAlreadyExists');
            }
        }
        return true;
    };

//# sourceMappingURL=validateOptions.js.map