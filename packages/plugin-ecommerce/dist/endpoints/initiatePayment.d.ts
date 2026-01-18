import { type Endpoint } from 'payload';
import type { CurrenciesConfig, PaymentAdapter, ProductsValidation, SanitizedEcommercePluginConfig } from '../types/index.js';
type Args = {
    /**
     * The slug of the carts collection, defaults to 'carts'.
     */
    cartsSlug?: string;
    currenciesConfig: CurrenciesConfig;
    /**
     * The slug of the customers collection, defaults to 'users'.
     */
    customersSlug?: string;
    /**
     * Track inventory stock for the products and variants.
     * Accepts an object to override the default field name.
     */
    inventory?: SanitizedEcommercePluginConfig['inventory'];
    paymentMethod: PaymentAdapter;
    /**
     * The slug of the products collection, defaults to 'products'.
     */
    productsSlug?: string;
    /**
     * Customise the validation used for checking products or variants before a transaction is created.
     */
    productsValidation?: ProductsValidation;
    /**
     * The slug of the transactions collection, defaults to 'transactions'.
     */
    transactionsSlug?: string;
    /**
     * The slug of the variants collection, defaults to 'variants'.
     */
    variantsSlug?: string;
};
type InitiatePayment = (args: Args) => Endpoint['handler'];
/**
 * Handles the endpoint for initiating payments. We will handle checking the amount and product and variant prices here before it is sent to the payment provider.
 * This is the first step in the payment process.
 */
export declare const initiatePaymentHandler: InitiatePayment;
export {};
//# sourceMappingURL=initiatePayment.d.ts.map