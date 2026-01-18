import { describe, beforeAll, it, expect } from 'vitest';
import { sanitizeConfig } from 'payload';
import { buildSortParam } from './buildSortParam.js';
let config;
describe('builds sort params', ()=>{
    beforeAll(async ()=>{
        config = await sanitizeConfig({
            localization: {
                defaultLocale: 'en',
                fallback: true,
                locales: [
                    'en',
                    'es'
                ]
            }
        });
    });
    it('adds a fallback on non-unique field', ()=>{
        const result = buildSortParam({
            config,
            parentIsLocalized: false,
            fields: [
                {
                    name: 'title',
                    type: 'text'
                },
                {
                    name: 'order',
                    type: 'number'
                }
            ],
            locale: 'en',
            sort: 'order',
            timestamps: true,
            adapter: {
                disableFallbackSort: false
            }
        });
        expect(result).toStrictEqual({
            order: 'asc',
            createdAt: 'desc'
        });
    });
    it('adds a fallback when sort isnt provided', ()=>{
        const result = buildSortParam({
            config,
            parentIsLocalized: false,
            fields: [
                {
                    name: 'title',
                    type: 'text'
                },
                {
                    name: 'order',
                    type: 'number'
                }
            ],
            locale: 'en',
            sort: undefined,
            timestamps: true,
            adapter: {
                disableFallbackSort: false
            }
        });
        expect(result).toStrictEqual({
            createdAt: 'desc'
        });
    });
    it('does not add a fallback on non-unique field when disableFallbackSort is true', ()=>{
        const result = buildSortParam({
            config,
            parentIsLocalized: false,
            fields: [
                {
                    name: 'title',
                    type: 'text'
                },
                {
                    name: 'order',
                    type: 'number'
                }
            ],
            locale: 'en',
            sort: 'order',
            timestamps: true,
            adapter: {
                disableFallbackSort: true
            }
        });
        expect(result).toStrictEqual({
            order: 'asc'
        });
    });
    // This test should be true even when disableFallbackSort is false
    it('does not add a fallback on unique field', ()=>{
        const result = buildSortParam({
            config,
            parentIsLocalized: false,
            fields: [
                {
                    name: 'title',
                    type: 'text'
                },
                {
                    name: 'order',
                    type: 'number',
                    unique: true
                }
            ],
            locale: 'en',
            sort: 'order',
            timestamps: true,
            adapter: {
                disableFallbackSort: false
            }
        });
        expect(result).toStrictEqual({
            order: 'asc'
        });
    });
});

//# sourceMappingURL=buildSortParam.spec.js.map