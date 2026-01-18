import { describe, it, expect } from 'vitest';
import { EUR, USD } from '../currencies/index.js';
import { defaultProductsValidation } from './defaultProductsValidation';
import { MissingPrice, OutOfStock } from './errorCodes';
describe('defaultProductsValidation', ()=>{
    const currenciesConfig = {
        defaultCurrency: 'USD',
        supportedCurrencies: [
            USD,
            EUR
        ]
    };
    describe('currency validation', ()=>{
        it('should throw error when currency is not provided', ()=>{
            const product = {
                id: 'product-1',
                priceInUSD: 1000
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: '',
                    product: product,
                    quantity: 1
                });
            }).toThrow('Currency must be provided for product validation.');
        });
        it('should throw error when currency is undefined', ()=>{
            const product = {
                id: 'product-1',
                priceInUSD: 1000
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: undefined,
                    product: product,
                    quantity: 1
                });
            }).toThrow('Currency must be provided for product validation.');
        });
    });
    describe('variant validation', ()=>{
        it('should validate variant price exists', ()=>{
            const variant = {
                id: 'variant-1',
                priceInEUR: 900,
                inventory: 10
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: {},
                    quantity: 1,
                    variant: variant
                });
            }).toThrow('Variant with ID variant-1 does not have a price in usd.');
        });
        it('should pass when variant has price in requested currency', ()=>{
            const variant = {
                id: 'variant-1',
                priceInUSD: 1000,
                inventory: 10
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: {},
                    quantity: 1,
                    variant: variant
                });
            }).not.toThrow();
        });
        it('should handle case-insensitive currency codes', ()=>{
            const variant = {
                id: 'variant-1',
                priceInUSD: 1000,
                inventory: 10
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'USD',
                    product: {},
                    quantity: 1,
                    variant: variant
                });
            }).not.toThrow();
        });
        it('should throw error when variant inventory is 0', ()=>{
            const variant = {
                id: 'variant-1',
                priceInUSD: 1000,
                inventory: 0
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: {},
                    quantity: 1,
                    variant: variant
                });
            }).toThrow('Variant with ID variant-1 is out of stock or does not have enough inventory.');
        });
        it('should throw error when variant inventory is less than quantity', ()=>{
            const variant = {
                id: 'variant-1',
                priceInUSD: 1000,
                inventory: 5
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: {},
                    quantity: 10,
                    variant: variant
                });
            }).toThrow('Variant with ID variant-1 is out of stock or does not have enough inventory.');
        });
        it('should pass when variant inventory equals quantity', ()=>{
            const variant = {
                id: 'variant-1',
                priceInUSD: 1000,
                inventory: 5
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: {},
                    quantity: 5,
                    variant: variant
                });
            }).not.toThrow();
        });
        it('should pass when variant inventory is greater than quantity', ()=>{
            const variant = {
                id: 'variant-1',
                priceInUSD: 1000,
                inventory: 10
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: {},
                    quantity: 5,
                    variant: variant
                });
            }).not.toThrow();
        });
        it('should pass when variant has no inventory field (unlimited stock)', ()=>{
            const variant = {
                id: 'variant-1',
                priceInUSD: 1000
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: {},
                    quantity: 100,
                    variant: variant
                });
            }).not.toThrow();
        });
    });
    describe('product validation', ()=>{
        it('should validate product price exists', ()=>{
            const product = {
                id: 'product-1',
                priceInEUR: 900,
                inventory: 10
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: product,
                    quantity: 1
                });
            }).toThrow('Product does not have a price in.');
        });
        it('should include error cause with MissingPrice code', ()=>{
            const product = {
                id: 'product-1',
                priceInEUR: 900,
                inventory: 10
            };
            try {
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: product,
                    quantity: 1
                });
            } catch (error) {
                expect(error.cause).toEqual({
                    code: MissingPrice,
                    codes: [
                        'product-1',
                        'usd'
                    ]
                });
            }
        });
        it('should pass when product has price in requested currency', ()=>{
            const product = {
                id: 'product-1',
                priceInUSD: 1000,
                inventory: 10
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: product,
                    quantity: 1
                });
            }).not.toThrow();
        });
        it('should throw error when product inventory is 0', ()=>{
            const product = {
                id: 'product-1',
                priceInUSD: 1000,
                inventory: 0
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: product,
                    quantity: 1
                });
            }).toThrow('Product is out of stock or does not have enough inventory.');
        });
        it('should include error cause with OutOfStock code', ()=>{
            const product = {
                id: 'product-1',
                priceInUSD: 1000,
                inventory: 0
            };
            try {
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: product,
                    quantity: 1
                });
            } catch (error) {
                expect(error.cause).toEqual({
                    code: OutOfStock,
                    codes: [
                        'product-1'
                    ]
                });
            }
        });
        it('should throw error when product inventory is less than quantity', ()=>{
            const product = {
                id: 'product-1',
                priceInUSD: 1000,
                inventory: 5
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: product,
                    quantity: 10
                });
            }).toThrow('Product is out of stock or does not have enough inventory.');
        });
        it('should pass when product inventory equals quantity', ()=>{
            const product = {
                id: 'product-1',
                priceInUSD: 1000,
                inventory: 5
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: product,
                    quantity: 5
                });
            }).not.toThrow();
        });
        it('should pass when product inventory is greater than quantity', ()=>{
            const product = {
                id: 'product-1',
                priceInUSD: 1000,
                inventory: 10
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: product,
                    quantity: 5
                });
            }).not.toThrow();
        });
        it('should pass when product has no inventory field (unlimited stock)', ()=>{
            const product = {
                id: 'product-1',
                priceInUSD: 1000
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: product,
                    quantity: 100
                });
            }).not.toThrow();
        });
        it('should default quantity to 1 when not provided', ()=>{
            const product = {
                id: 'product-1',
                priceInUSD: 1000,
                inventory: 1
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: product
                });
            }).not.toThrow();
        });
    });
    describe('variant priority over product', ()=>{
        it('should only validate variant when both product and variant are provided', ()=>{
            const product = {
                id: 'product-1',
                priceInEUR: 900,
                inventory: 0
            };
            const variant = {
                id: 'variant-1',
                priceInUSD: 1000,
                inventory: 10
            };
            // Should not throw because variant validation takes priority
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: product,
                    quantity: 1,
                    variant: variant
                });
            }).not.toThrow();
        });
        it('should not validate product inventory when variant is provided', ()=>{
            const product = {
                id: 'product-1',
                priceInUSD: 1000,
                inventory: 0
            };
            const variant = {
                id: 'variant-1',
                priceInUSD: 1000,
                inventory: 10
            };
            expect(()=>{
                defaultProductsValidation({
                    currenciesConfig,
                    currency: 'usd',
                    product: product,
                    quantity: 1,
                    variant: variant
                });
            }).not.toThrow();
        });
    });
});

//# sourceMappingURL=defaultProductsValidation.spec.js.map