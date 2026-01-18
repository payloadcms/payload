import { amountField } from '../../fields/amountField.js';
import { cartItemsField } from '../../fields/cartItemsField.js';
import { currencyField } from '../../fields/currencyField.js';
import { statusField } from '../../fields/statusField.js';
export const createTransactionsCollection = (props)=>{
    const { access, addressFields, cartsSlug = 'carts', currenciesConfig, customersSlug = 'users', enableVariants = false, ordersSlug = 'orders', paymentMethods, productsSlug = 'products', variantsSlug = 'variants' } = props || {};
    const fields = [
        {
            type: 'tabs',
            tabs: [
                {
                    fields: [
                        cartItemsField({
                            enableVariants,
                            overrides: {
                                name: 'items',
                                label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                                    t('plugin-ecommerce:items'),
                                labels: {
                                    plural: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                                        t('plugin-ecommerce:items'),
                                    singular: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                                        t('plugin-ecommerce:item')
                                }
                            },
                            productsSlug,
                            variantsSlug
                        }),
                        ...paymentMethods?.length && paymentMethods.length > 0 ? [
                            {
                                name: 'paymentMethod',
                                type: 'select',
                                label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                                    t('plugin-ecommerce:paymentMethod'),
                                options: paymentMethods.map((method)=>({
                                        label: method.label ?? method.name,
                                        value: method.name
                                    }))
                            },
                            ...paymentMethods.map((method)=>method.group) || []
                        ] : []
                    ],
                    label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                        t('plugin-ecommerce:transactionDetails')
                },
                {
                    fields: [
                        ...addressFields ? [
                            {
                                name: 'billingAddress',
                                type: 'group',
                                fields: addressFields,
                                label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                                    t('plugin-ecommerce:billingAddress')
                            }
                        ] : []
                    ],
                    label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                        t('plugin-ecommerce:billing')
                }
            ]
        },
        statusField({
            overrides: {
                admin: {
                    position: 'sidebar'
                }
            }
        }),
        {
            name: 'customer',
            type: 'relationship',
            admin: {
                position: 'sidebar'
            },
            label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:customer'),
            relationTo: customersSlug
        },
        {
            name: 'customerEmail',
            type: 'email',
            admin: {
                position: 'sidebar'
            },
            label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:customerEmail')
        },
        {
            name: 'order',
            type: 'relationship',
            admin: {
                position: 'sidebar'
            },
            label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:order'),
            relationTo: ordersSlug
        },
        {
            name: 'cart',
            type: 'relationship',
            admin: {
                position: 'sidebar'
            },
            relationTo: cartsSlug
        },
        ...currenciesConfig ? [
            {
                type: 'row',
                admin: {
                    position: 'sidebar'
                },
                fields: [
                    amountField({
                        currenciesConfig
                    }),
                    currencyField({
                        currenciesConfig
                    })
                ]
            }
        ] : []
    ];
    const baseConfig = {
        slug: 'transactions',
        access: {
            create: access.isAdmin,
            delete: access.isAdmin,
            read: access.isAdmin,
            update: access.isAdmin
        },
        admin: {
            defaultColumns: [
                'createdAt',
                'customer',
                'order',
                'amount',
                'status'
            ],
            description: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:transactionsCollectionDescription'),
            group: 'Ecommerce'
        },
        fields,
        labels: {
            plural: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:transactions'),
            singular: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:transaction')
        }
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=createTransactionsCollection.js.map