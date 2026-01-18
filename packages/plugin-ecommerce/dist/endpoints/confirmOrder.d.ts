import { type Endpoint } from 'payload';
import type { CurrenciesConfig, PaymentAdapter, ProductsValidation } from '../types/index.js';
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
     * The slug of the orders collection, defaults to 'orders'.
     */
    ordersSlug?: string;
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
type ConfirmOrderHandler = (args: Args) => Endpoint['handler'];
/**
 * Handles the endpoint for initiating payments. We will handle checking the amount and product and variant prices here before it is sent to the payment provider.
 * This is the first step in the payment process.
 */
export declare const confirmOrderHandler: ConfirmOrderHandler;
export {};
//# sourceMappingURL=confirmOrder.d.ts.map