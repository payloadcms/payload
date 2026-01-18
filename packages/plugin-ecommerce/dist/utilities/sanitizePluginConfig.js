import { defaultAddressFields } from '../collections/addresses/defaultAddressFields.js';
import { USD } from '../currencies/index.js';
export const sanitizePluginConfig = ({ pluginConfig })=>{
    const config = {
        ...pluginConfig
    };
    if (typeof config.customers === 'undefined') {
        config.customers = {
            slug: 'users'
        };
    }
    if (typeof config.addresses === 'undefined' || typeof config.addresses === 'boolean' && config.addresses === true) {
        config.addresses = {
            addressFields: defaultAddressFields()
        };
    } else {
        const addressFields = typeof pluginConfig.addresses === 'object' && typeof pluginConfig.addresses.addressFields === 'function' && pluginConfig.addresses.addressFields({
            defaultFields: defaultAddressFields()
        }) || defaultAddressFields();
        config.addresses = {
            ...config.addresses,
            addressFields
        };
    }
    if (!config.currencies) {
        config.currencies = {
            defaultCurrency: 'USD',
            supportedCurrencies: [
                USD
            ]
        };
    }
    if (typeof config.inventory === 'undefined' || typeof config.inventory === 'boolean' && config.inventory === true) {
        config.inventory = {
            fieldName: 'inventory'
        };
    }
    if (typeof config.carts === 'undefined') {
        config.carts = {
            allowGuestCarts: true
        };
    } else if (config.carts === true) {
        config.carts = {
            allowGuestCarts: true
        };
    } else if (typeof config.carts === 'object' && typeof config.carts.allowGuestCarts === 'undefined') {
        config.carts.allowGuestCarts = true;
    }
    if (typeof config.orders === 'undefined') {
        config.orders = true;
    }
    if (typeof config.transactions === 'undefined') {
        config.transactions = true;
    }
    if (typeof config.payments === 'undefined') {
        config.payments = {
            paymentMethods: []
        };
    } else if (!config.payments.paymentMethods) {
        config.payments.paymentMethods = [];
    }
    if (config.products) {
        if (typeof config.products === 'object' && typeof config.products.variants === 'undefined') {
            config.products.variants = true;
        }
    }
    config.access = {
        isAuthenticated: ({ req })=>Boolean(req?.user),
        publicAccess: ()=>true,
        ...pluginConfig.access
    };
    return config;
};

//# sourceMappingURL=sanitizePluginConfig.js.map