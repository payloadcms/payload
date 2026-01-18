import { deepMergeSimple } from 'payload/shared';
import { createAddressesCollection } from './collections/addresses/createAddressesCollection.js';
import { createCartsCollection } from './collections/carts/createCartsCollection.js';
import { createOrdersCollection } from './collections/orders/createOrdersCollection.js';
import { createProductsCollection } from './collections/products/createProductsCollection.js';
import { createTransactionsCollection } from './collections/transactions/createTransactionsCollection.js';
import { createVariantOptionsCollection } from './collections/variants/createVariantOptionsCollection.js';
import { createVariantsCollection } from './collections/variants/createVariantsCollection/index.js';
import { createVariantTypesCollection } from './collections/variants/createVariantTypesCollection.js';
import { confirmOrderHandler } from './endpoints/confirmOrder.js';
import { initiatePaymentHandler } from './endpoints/initiatePayment.js';
import { translations } from './translations/index.js';
import { getCollectionSlugMap } from './utilities/getCollectionSlugMap.js';
import { pushTypeScriptProperties } from './utilities/pushTypeScriptProperties.js';
import { sanitizePluginConfig } from './utilities/sanitizePluginConfig.js';
export const ecommercePlugin = (pluginConfig)=>async (incomingConfig)=>{
        if (!pluginConfig) {
            return incomingConfig;
        }
        const sanitizedPluginConfig = sanitizePluginConfig({
            pluginConfig
        });
        const accessConfig = sanitizedPluginConfig.access;
        // Ensure collections exists
        if (!incomingConfig.collections) {
            incomingConfig.collections = [];
        }
        // Determine if variants are enabled based on products config
        const productsConfig = typeof sanitizedPluginConfig.products === 'boolean' ? sanitizedPluginConfig.products ? {
            variants: true
        } : undefined : sanitizedPluginConfig.products;
        const enableVariants = Boolean(productsConfig?.variants);
        /**
     * Used to keep track of the slugs of collections in case they are overridden by the user.
     * Variant-related slugs are only included when variants are enabled.
     */ const collectionSlugMap = getCollectionSlugMap({
            enableVariants,
            sanitizedPluginConfig
        });
        const currenciesConfig = sanitizedPluginConfig.currencies;
        let addressFields;
        if (sanitizedPluginConfig.addresses) {
            addressFields = sanitizedPluginConfig.addresses.addressFields;
            const supportedCountries = sanitizedPluginConfig.addresses.supportedCountries;
            const defaultAddressesCollection = createAddressesCollection({
                access: accessConfig,
                addressFields,
                customersSlug: collectionSlugMap.customers,
                supportedCountries
            });
            const addressesCollection = sanitizedPluginConfig.addresses && typeof sanitizedPluginConfig.addresses === 'object' && 'addressesCollectionOverride' in sanitizedPluginConfig.addresses && sanitizedPluginConfig.addresses.addressesCollectionOverride ? await sanitizedPluginConfig.addresses.addressesCollectionOverride({
                defaultCollection: defaultAddressesCollection
            }) : defaultAddressesCollection;
            incomingConfig.collections.push(addressesCollection);
        }
        if (productsConfig) {
            if (productsConfig.variants) {
                const variantsConfig = typeof productsConfig.variants === 'boolean' ? undefined : productsConfig.variants;
                const defaultVariantsCollection = createVariantsCollection({
                    access: accessConfig,
                    currenciesConfig,
                    inventory: sanitizedPluginConfig.inventory,
                    productsSlug: collectionSlugMap.products,
                    variantOptionsSlug: collectionSlugMap.variantOptions ?? 'variantOptions',
                    variantTypesSlug: collectionSlugMap.variantTypes ?? 'variantTypes'
                });
                const variants = variantsConfig && typeof variantsConfig === 'object' && 'variantsCollectionOverride' in variantsConfig && variantsConfig.variantsCollectionOverride ? await variantsConfig.variantsCollectionOverride({
                    defaultCollection: defaultVariantsCollection
                }) : defaultVariantsCollection;
                const defaultVariantTypesCollection = createVariantTypesCollection({
                    access: accessConfig,
                    variantOptionsSlug: collectionSlugMap.variantOptions ?? 'variantOptions'
                });
                const variantTypes = variantsConfig && typeof variantsConfig === 'object' && 'variantTypesCollectionOverride' in variantsConfig && variantsConfig.variantTypesCollectionOverride ? await variantsConfig.variantTypesCollectionOverride({
                    defaultCollection: defaultVariantTypesCollection
                }) : defaultVariantTypesCollection;
                const defaultVariantOptionsCollection = createVariantOptionsCollection({
                    access: accessConfig,
                    variantTypesSlug: collectionSlugMap.variantTypes ?? 'variantTypes'
                });
                const variantOptions = variantsConfig && typeof variantsConfig === 'object' && 'variantOptionsCollectionOverride' in variantsConfig && variantsConfig.variantOptionsCollectionOverride ? await variantsConfig.variantOptionsCollectionOverride({
                    defaultCollection: defaultVariantOptionsCollection
                }) : defaultVariantOptionsCollection;
                incomingConfig.collections.push(variants, variantTypes, variantOptions);
            }
            const defaultProductsCollection = createProductsCollection({
                access: accessConfig,
                currenciesConfig,
                enableVariants,
                inventory: sanitizedPluginConfig.inventory,
                variantsSlug: collectionSlugMap.variants ?? 'variants',
                variantTypesSlug: collectionSlugMap.variantTypes ?? 'variantTypes'
            });
            const productsCollection = productsConfig && 'productsCollectionOverride' in productsConfig && productsConfig.productsCollectionOverride ? await productsConfig.productsCollectionOverride({
                defaultCollection: defaultProductsCollection
            }) : defaultProductsCollection;
            incomingConfig.collections.push(productsCollection);
            if (sanitizedPluginConfig.carts) {
                const cartsConfig = typeof sanitizedPluginConfig.carts === 'object' ? sanitizedPluginConfig.carts : {};
                const defaultCartsCollection = createCartsCollection({
                    access: accessConfig,
                    allowGuestCarts: cartsConfig.allowGuestCarts,
                    cartItemMatcher: cartsConfig.cartItemMatcher,
                    currenciesConfig,
                    customersSlug: collectionSlugMap.customers,
                    enableVariants: Boolean(productsConfig.variants),
                    productsSlug: collectionSlugMap.products,
                    variantsSlug: collectionSlugMap.variants ?? 'variants'
                });
                const cartsCollection = sanitizedPluginConfig.carts && typeof sanitizedPluginConfig.carts === 'object' && 'cartsCollectionOverride' in sanitizedPluginConfig.carts && sanitizedPluginConfig.carts.cartsCollectionOverride ? await sanitizedPluginConfig.carts.cartsCollectionOverride({
                    defaultCollection: defaultCartsCollection
                }) : defaultCartsCollection;
                incomingConfig.collections.push(cartsCollection);
            }
        }
        if (sanitizedPluginConfig.orders) {
            const defaultOrdersCollection = createOrdersCollection({
                access: accessConfig,
                addressFields,
                currenciesConfig,
                customersSlug: collectionSlugMap.customers,
                enableVariants,
                productsSlug: collectionSlugMap.products,
                variantsSlug: collectionSlugMap.variants ?? 'variants'
            });
            const ordersCollection = sanitizedPluginConfig.orders && typeof sanitizedPluginConfig.orders === 'object' && 'ordersCollectionOverride' in sanitizedPluginConfig.orders && sanitizedPluginConfig.orders.ordersCollectionOverride ? await sanitizedPluginConfig.orders.ordersCollectionOverride({
                defaultCollection: defaultOrdersCollection
            }) : defaultOrdersCollection;
            incomingConfig.collections.push(ordersCollection);
        }
        const paymentMethods = sanitizedPluginConfig.payments.paymentMethods;
        if (sanitizedPluginConfig.payments) {
            if (paymentMethods.length) {
                if (!Array.isArray(incomingConfig.endpoints)) {
                    incomingConfig.endpoints = [];
                }
                const productsValidation = typeof sanitizedPluginConfig.products === 'object' && sanitizedPluginConfig.products.validation || undefined;
                paymentMethods.forEach((paymentMethod)=>{
                    const methodPath = `/payments/${paymentMethod.name}`;
                    const endpoints = [];
                    const initiatePayment = {
                        handler: initiatePaymentHandler({
                            currenciesConfig,
                            inventory: sanitizedPluginConfig.inventory,
                            paymentMethod,
                            productsSlug: collectionSlugMap.products,
                            productsValidation,
                            transactionsSlug: collectionSlugMap.transactions,
                            variantsSlug: collectionSlugMap.variants ?? 'variants'
                        }),
                        method: 'post',
                        path: `${methodPath}/initiate`
                    };
                    const confirmOrder = {
                        handler: confirmOrderHandler({
                            cartsSlug: collectionSlugMap.carts,
                            currenciesConfig,
                            ordersSlug: collectionSlugMap.orders,
                            paymentMethod,
                            productsSlug: collectionSlugMap.products,
                            productsValidation,
                            transactionsSlug: collectionSlugMap.transactions,
                            variantsSlug: collectionSlugMap.variants ?? 'variants'
                        }),
                        method: 'post',
                        path: `${methodPath}/confirm-order`
                    };
                    endpoints.push(initiatePayment, confirmOrder);
                    // Attach any additional endpoints defined in the payment method
                    if (paymentMethod.endpoints && paymentMethod.endpoints.length > 0) {
                        const methodEndpoints = paymentMethod.endpoints.map((endpoint)=>{
                            const path = endpoint.path.startsWith('/') ? endpoint.path : `/${endpoint.path}`;
                            return {
                                ...endpoint,
                                path: `${methodPath}${path}`
                            };
                        });
                        endpoints.push(...methodEndpoints);
                    }
                    incomingConfig.endpoints.push(...endpoints);
                });
            }
        }
        if (sanitizedPluginConfig.transactions) {
            const defaultTransactionsCollection = createTransactionsCollection({
                access: accessConfig,
                addressFields,
                cartsSlug: collectionSlugMap.carts,
                currenciesConfig,
                customersSlug: collectionSlugMap.customers,
                enableVariants,
                ordersSlug: collectionSlugMap.orders,
                paymentMethods,
                productsSlug: collectionSlugMap.products,
                variantsSlug: collectionSlugMap.variants ?? 'variants'
            });
            const transactionsCollection = sanitizedPluginConfig.transactions && typeof sanitizedPluginConfig.transactions === 'object' && 'transactionsCollectionOverride' in sanitizedPluginConfig.transactions && sanitizedPluginConfig.transactions.transactionsCollectionOverride ? await sanitizedPluginConfig.transactions.transactionsCollectionOverride({
                defaultCollection: defaultTransactionsCollection
            }) : defaultTransactionsCollection;
            incomingConfig.collections.push(transactionsCollection);
        }
        if (!incomingConfig.i18n) {
            incomingConfig.i18n = {};
        }
        if (!incomingConfig.i18n?.translations) {
            incomingConfig.i18n.translations = {};
        }
        incomingConfig.i18n.translations = deepMergeSimple(translations, incomingConfig.i18n?.translations);
        /**
     * Merge plugin translations
     */ if (!incomingConfig.i18n) {
            incomingConfig.i18n = {};
        }
        Object.entries(translations).forEach(([locale, pluginI18nObject])=>{
            const typedLocale = locale;
            if (!incomingConfig.i18n.translations) {
                incomingConfig.i18n.translations = {};
            }
            if (!(typedLocale in incomingConfig.i18n.translations)) {
                incomingConfig.i18n.translations[typedLocale] = {};
            }
            if (!('plugin-ecommerce' in incomingConfig.i18n.translations[typedLocale])) {
                ;
                incomingConfig.i18n.translations[typedLocale]['plugin-ecommerce'] = {};
            }
            ;
            incomingConfig.i18n.translations[typedLocale]['plugin-ecommerce'] = {
                ...pluginI18nObject.translations['plugin-ecommerce']
            };
        });
        if (!incomingConfig.typescript) {
            incomingConfig.typescript = {};
        }
        if (!incomingConfig.typescript.schema) {
            incomingConfig.typescript.schema = [];
        }
        incomingConfig.typescript.schema.push((args)=>pushTypeScriptProperties({
                ...args,
                collectionSlugMap,
                sanitizedPluginConfig
            }));
        return incomingConfig;
    };
export { createAddressesCollection, createCartsCollection, createOrdersCollection, createProductsCollection, createTransactionsCollection, createVariantOptionsCollection, createVariantsCollection, createVariantTypesCollection,  };
export { addItem } from './collections/carts/operations/addItem.js';
export { clearCart } from './collections/carts/operations/clearCart.js';
export { defaultCartItemMatcher } from './collections/carts/operations/defaultCartItemMatcher.js';
export { removeItem } from './collections/carts/operations/removeItem.js';
export { isNumericOperator } from './collections/carts/operations/types.js';
export { updateItem } from './collections/carts/operations/updateItem.js';
export { EUR, GBP, USD } from './currencies/index.js';
export { amountField } from './fields/amountField.js';
export { currencyField } from './fields/currencyField.js';
export { pricesField } from './fields/pricesField.js';
export { statusField } from './fields/statusField.js';
export { variantsFields } from './fields/variantsFields.js';

//# sourceMappingURL=index.js.map