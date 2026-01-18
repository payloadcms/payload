export const amountField = ({ currenciesConfig, currency, overrides })=>{
    // @ts-expect-error - issue with payload types
    const field = {
        name: 'amount',
        type: 'number',
        label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
            t('plugin-ecommerce:amount'),
        ...overrides,
        admin: {
            components: {
                Cell: {
                    clientProps: {
                        currenciesConfig,
                        currency
                    },
                    path: '@payloadcms/plugin-ecommerce/client#PriceCell'
                },
                Field: {
                    clientProps: {
                        currenciesConfig,
                        currency
                    },
                    path: '@payloadcms/plugin-ecommerce/rsc#PriceInput'
                },
                ...overrides?.admin?.components
            },
            ...overrides?.admin
        }
    };
    return field;
};

//# sourceMappingURL=amountField.js.map