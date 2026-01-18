import { MissingPrice, OutOfStock } from './errorCodes.js';
export const defaultProductsValidation = ({ currenciesConfig, currency, product, quantity = 1, variant })=>{
    if (!currency) {
        throw new Error('Currency must be provided for product validation.');
    }
    const priceField = `priceIn${currency.toUpperCase()}`;
    if (variant) {
        if (!variant[priceField]) {
            throw new Error(`Variant with ID ${variant.id} does not have a price in ${currency}.`);
        }
        if (variant.inventory === 0 || variant.inventory && variant.inventory < quantity) {
            throw new Error(`Variant with ID ${variant.id} is out of stock or does not have enough inventory.`);
        }
    } else if (product) {
        // Validate the product's details only if the variant is not provided as it can have its own inventory and price
        if (!product[priceField]) {
            throw new Error(`Product does not have a price in.`, {
                cause: {
                    code: MissingPrice,
                    codes: [
                        product.id,
                        currency
                    ]
                }
            });
        }
        if (product.inventory === 0 || product.inventory && product.inventory < quantity) {
            throw new Error(`Product is out of stock or does not have enough inventory.`, {
                cause: {
                    code: OutOfStock,
                    codes: [
                        product.id
                    ]
                }
            });
        }
    }
};

//# sourceMappingURL=defaultProductsValidation.js.map