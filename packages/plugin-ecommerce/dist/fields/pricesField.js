import { amountField } from './amountField.js';
export const pricesField = ({ conditionalPath, currenciesConfig })=>{
    const currencies = currenciesConfig.supportedCurrencies;
    const fields = currencies.map((currency)=>{
        const name = `priceIn${currency.code}`;
        const path = conditionalPath ? `${conditionalPath}.${name}Enabled` : `${name}Enabled`;
        return {
            type: 'group',
            admin: {
                description: 'Prices for this product in different currencies.'
            },
            fields: [
                {
                    type: 'row',
                    fields: [
                        {
                            name: `${name}Enabled`,
                            type: 'checkbox',
                            admin: {
                                style: {
                                    alignSelf: 'baseline',
                                    flex: '0 0 auto'
                                }
                            },
                            label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                                t('plugin-ecommerce:enableCurrencyPrice', {
                                    currency: currency.code
                                })
                        },
                        amountField({
                            currenciesConfig,
                            currency,
                            overrides: {
                                name,
                                admin: {
                                    condition: (_, siblingData)=>Boolean(siblingData?.[path]),
                                    description: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                                        t('plugin-ecommerce:productPriceDescription')
                                },
                                // @ts-expect-error - translations are not typed in plugins yet
                                label: ({ t })=>t('plugin-ecommerce:priceIn', {
                                        currency: currency.code
                                    })
                            }
                        })
                    ]
                }
            ]
        };
    });
    return fields;
};

//# sourceMappingURL=pricesField.js.map