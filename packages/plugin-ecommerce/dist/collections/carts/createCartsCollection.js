import { amountField } from '../../fields/amountField.js';
import { cartItemsField } from '../../fields/cartItemsField.js';
import { currencyField } from '../../fields/currencyField.js';
import { accessOR, conditional } from '../../utilities/accessComposition.js';
import { beforeChangeCart } from './beforeChange.js';
import { addItemEndpoint } from './endpoints/addItem.js';
import { clearCartEndpoint } from './endpoints/clearCart.js';
import { mergeCartEndpoint } from './endpoints/mergeCart.js';
import { removeItemEndpoint } from './endpoints/removeItem.js';
import { updateItemEndpoint } from './endpoints/updateItem.js';
import { hasCartSecretAccess } from './hasCartSecretAccess.js';
import { statusBeforeRead } from './statusBeforeRead.js';
export const createCartsCollection = (props)=>{
    const { access, allowGuestCarts = false, cartItemMatcher, currenciesConfig, customersSlug = 'users', enableVariants = false, productsSlug = 'products', variantsSlug = 'variants' } = props || {};
    const cartsSlug = 'carts';
    const fields = [
        cartItemsField({
            enableVariants,
            overrides: {
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
        {
            name: 'secret',
            type: 'text',
            access: {
                create: ()=>false,
                read: ()=>false,
                update: ()=>false
            },
            admin: {
                hidden: true,
                position: 'sidebar',
                readOnly: true
            },
            index: true,
            label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:cartSecret')
        },
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
            name: 'purchasedAt',
            type: 'date',
            admin: {
                date: {
                    pickerAppearance: 'dayAndTime'
                },
                position: 'sidebar'
            },
            label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:purchasedAt')
        },
        {
            name: 'status',
            type: 'select',
            admin: {
                position: 'sidebar',
                readOnly: true
            },
            hooks: {
                afterRead: [
                    statusBeforeRead
                ]
            },
            label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:status'),
            options: [
                {
                    // @ts-expect-error - translations are not typed in plugins yet
                    label: ({ t })=>t('plugin-ecommerce:active'),
                    value: 'active'
                },
                {
                    // @ts-expect-error - translations are not typed in plugins yet
                    label: ({ t })=>t('plugin-ecommerce:purchased'),
                    value: 'purchased'
                },
                {
                    // @ts-expect-error - translations are not typed in plugins yet
                    label: ({ t })=>t('plugin-ecommerce:abandoned'),
                    value: 'abandoned'
                }
            ],
            virtual: true
        },
        ...currenciesConfig ? [
            {
                type: 'row',
                admin: {
                    position: 'sidebar'
                },
                fields: [
                    amountField({
                        currenciesConfig,
                        overrides: {
                            name: 'subtotal',
                            label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                                t('plugin-ecommerce:subtotal')
                        }
                    }),
                    currencyField({
                        currenciesConfig
                    })
                ]
            }
        ] : []
    ];
    // Internal access function for guest users (unauthenticated)
    const isGuest = ({ req })=>!req.user;
    const baseConfig = {
        slug: cartsSlug,
        access: {
            create: accessOR(access.isAdmin, access.isAuthenticated, conditional(allowGuestCarts, isGuest)),
            delete: accessOR(access.isAdmin, access.isDocumentOwner, hasCartSecretAccess(allowGuestCarts)),
            read: accessOR(access.isAdmin, access.isDocumentOwner, hasCartSecretAccess(allowGuestCarts)),
            update: accessOR(access.isAdmin, access.isDocumentOwner, hasCartSecretAccess(allowGuestCarts))
        },
        admin: {
            description: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:cartsCollectionDescription'),
            group: 'Ecommerce',
            useAsTitle: 'createdAt'
        },
        endpoints: [
            addItemEndpoint({
                cartItemMatcher,
                cartsSlug
            }),
            clearCartEndpoint({
                cartsSlug
            }),
            // mergeCartEndpoint uses its own matcher that handles CartItemData for both items
            mergeCartEndpoint({
                cartsSlug
            }),
            removeItemEndpoint({
                cartsSlug
            }),
            updateItemEndpoint({
                cartsSlug
            })
        ],
        fields,
        hooks: {
            afterRead: [
                ({ doc, req })=>{
                    // Include secret only if this was just created (stored in context by beforeChange)
                    if (req.context?.newCartSecret) {
                        doc.secret = req.context.newCartSecret;
                    }
                    // Secret is otherwise never exposed (field access is locked)
                    return doc;
                }
            ],
            beforeChange: [
                // This hook can be used to update the subtotal before saving the cart
                beforeChangeCart({
                    productsSlug,
                    variantsSlug
                })
            ]
        },
        labels: {
            plural: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:carts'),
            singular: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:cart')
        },
        timestamps: true
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=createCartsCollection.js.map