import { amountField } from './amountField.js';
import { currencyField } from './currencyField.js';
export const cartItemsField = (props)=>{
    const { currenciesConfig, enableVariants = false, individualPrices, overrides, productsSlug = 'products', variantsSlug = 'variants' } = props || {};
    const field = {
        name: 'items',
        type: 'array',
        admin: {
            initCollapsed: true
        },
        fields: [
            {
                name: 'product',
                type: 'relationship',
                label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                    t('plugin-ecommerce:product'),
                relationTo: productsSlug
            },
            ...enableVariants ? [
                {
                    name: 'variant',
                    type: 'relationship',
                    label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                        t('plugin-ecommerce:variant'),
                    relationTo: variantsSlug
                }
            ] : [],
            {
                name: 'quantity',
                type: 'number',
                defaultValue: 1,
                label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                    t('plugin-ecommerce:quantity'),
                min: 1,
                required: true
            },
            ...currenciesConfig && individualPrices ? [
                amountField({
                    currenciesConfig
                })
            ] : [],
            ...currenciesConfig ? [
                currencyField({
                    currenciesConfig
                })
            ] : []
        ],
        label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
            t('plugin-ecommerce:cart'),
        ...overrides
    };
    return field;
};

//# sourceMappingURL=cartItemsField.js.map