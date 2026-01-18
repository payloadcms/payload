import { describe, expect, it } from 'vitest';
import { defaultCartItemMatcher } from './defaultCartItemMatcher.js';
describe('defaultCartItemMatcher', ()=>{
    describe('product matching', ()=>{
        it('should match when product IDs are equal (both strings)', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                quantity: 1
            };
            const newItem = {
                product: 'product-123'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(true);
        });
        it('should not match when product IDs are different', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                quantity: 1
            };
            const newItem = {
                product: 'product-456'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(false);
        });
        it('should match when existing product is populated object', ()=>{
            const existingItem = {
                id: 'item-1',
                product: {
                    id: 'product-123',
                    name: 'Test Product'
                },
                quantity: 1
            };
            const newItem = {
                product: 'product-123'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(true);
        });
        it('should not match when product IDs differ (existing is object)', ()=>{
            const existingItem = {
                id: 'item-1',
                product: {
                    id: 'product-123',
                    name: 'Test Product'
                },
                quantity: 1
            };
            const newItem = {
                product: 'product-456'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(false);
        });
    });
    describe('variant matching', ()=>{
        it('should match when both have same variant ID', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                variant: 'variant-abc',
                quantity: 1
            };
            const newItem = {
                product: 'product-123',
                variant: 'variant-abc'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(true);
        });
        it('should not match when variants are different', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                variant: 'variant-abc',
                quantity: 1
            };
            const newItem = {
                product: 'product-123',
                variant: 'variant-xyz'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(false);
        });
        it('should match when both have no variant', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                quantity: 1
            };
            const newItem = {
                product: 'product-123'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(true);
        });
        it('should not match when existing has variant but new does not', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                variant: 'variant-abc',
                quantity: 1
            };
            const newItem = {
                product: 'product-123'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(false);
        });
        it('should not match when new has variant but existing does not', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                quantity: 1
            };
            const newItem = {
                product: 'product-123',
                variant: 'variant-abc'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(false);
        });
        it('should match when existing variant is populated object', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                variant: {
                    id: 'variant-abc',
                    name: 'Large'
                },
                quantity: 1
            };
            const newItem = {
                product: 'product-123',
                variant: 'variant-abc'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(true);
        });
        it('should not match when variant IDs differ (existing is object)', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                variant: {
                    id: 'variant-abc',
                    name: 'Large'
                },
                quantity: 1
            };
            const newItem = {
                product: 'product-123',
                variant: 'variant-xyz'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(false);
        });
    });
    describe('combined product and variant matching', ()=>{
        it('should match when both product and variant match', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                variant: 'variant-abc',
                quantity: 1
            };
            const newItem = {
                product: 'product-123',
                variant: 'variant-abc'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(true);
        });
        it('should not match when product matches but variant does not', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                variant: 'variant-abc',
                quantity: 1
            };
            const newItem = {
                product: 'product-123',
                variant: 'variant-xyz'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(false);
        });
        it('should not match when variant matches but product does not', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                variant: 'variant-abc',
                quantity: 1
            };
            const newItem = {
                product: 'product-456',
                variant: 'variant-abc'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(false);
        });
        it('should not match when neither product nor variant match', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                variant: 'variant-abc',
                quantity: 1
            };
            const newItem = {
                product: 'product-456',
                variant: 'variant-xyz'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(false);
        });
    });
    describe('edge cases', ()=>{
        it('should handle undefined variant in existing item', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                variant: undefined,
                quantity: 1
            };
            const newItem = {
                product: 'product-123'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(true);
        });
        it('should handle undefined variant in new item', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                quantity: 1
            };
            const newItem = {
                product: 'product-123',
                variant: undefined
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(true);
        });
        it('should handle numeric product IDs', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 123,
                quantity: 1
            };
            const newItem = {
                product: 123
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(true);
        });
        it('should handle deeply nested product object', ()=>{
            const existingItem = {
                id: 'item-1',
                product: {
                    id: 'product-123',
                    name: 'Product',
                    category: {
                        id: 'cat-1',
                        name: 'Category'
                    }
                },
                quantity: 1
            };
            const newItem = {
                product: 'product-123'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(true);
        });
        it('should handle both product and variant as populated objects', ()=>{
            const existingItem = {
                id: 'item-1',
                product: {
                    id: 'product-123',
                    name: 'Product'
                },
                variant: {
                    id: 'variant-abc',
                    name: 'Large'
                },
                quantity: 1
            };
            const newItem = {
                product: 'product-123',
                variant: 'variant-abc'
            };
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(true);
        });
        it('should ignore other item properties', ()=>{
            const existingItem = {
                id: 'item-1',
                product: 'product-123',
                quantity: 5,
                customProp: 'value-a'
            };
            const newItem = {
                product: 'product-123',
                customProp: 'value-b'
            };
            // Should match because only product/variant are checked
            expect(defaultCartItemMatcher({
                existingItem,
                newItem
            })).toBe(true);
        });
    });
});

//# sourceMappingURL=defaultCartItemMatcher.spec.js.map