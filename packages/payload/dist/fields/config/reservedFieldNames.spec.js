import { ReservedFieldName } from '../../errors/index.js';
import { sanitizeCollection } from '../../collections/config/sanitize.js';
import { describe, it, expect } from 'vitest';
describe('reservedFieldNames - collections -', ()=>{
    const config = {
        collections: [],
        globals: []
    };
    describe('uploads -', ()=>{
        const collectionWithUploads = {
            slug: 'collection-with-uploads',
            fields: [],
            upload: true
        };
        it('should throw on file', async ()=>{
            const fields = [
                {
                    name: 'file',
                    type: 'text',
                    label: 'some-collection'
                }
            ];
            await expect(async ()=>{
                await sanitizeCollection(// @ts-expect-error
                {
                    ...config,
                    collections: [
                        {
                            ...collectionWithUploads,
                            fields
                        }
                    ]
                }, {
                    ...collectionWithUploads,
                    fields
                });
            }).rejects.toThrow(ReservedFieldName);
        });
        it('should not throw on a custom field', async ()=>{
            const fields = [
                {
                    name: 'customField',
                    type: 'text',
                    label: 'some-collection'
                }
            ];
            await expect(async ()=>{
                await sanitizeCollection(// @ts-expect-error
                {
                    ...config,
                    collections: [
                        {
                            ...collectionWithUploads,
                            fields
                        }
                    ]
                }, {
                    ...collectionWithUploads,
                    fields
                });
            }).not.toThrow();
        });
    });
    describe('auth -', ()=>{
        const collectionWithAuth = {
            slug: 'collection-with-auth',
            auth: {
                loginWithUsername: true,
                useAPIKey: true,
                verify: true
            },
            fields: []
        };
        it('should throw on hash', async ()=>{
            const fields = [
                {
                    name: 'hash',
                    type: 'text',
                    label: 'some-collection'
                }
            ];
            await expect(async ()=>{
                await sanitizeCollection(// @ts-expect-error
                {
                    ...config,
                    collections: [
                        {
                            ...collectionWithAuth,
                            fields
                        }
                    ]
                }, {
                    ...collectionWithAuth,
                    fields
                });
            }).rejects.toThrow(ReservedFieldName);
        });
        it('should throw on salt', async ()=>{
            const fields = [
                {
                    name: 'salt',
                    type: 'text',
                    label: 'some-collection'
                }
            ];
            await expect(async ()=>{
                await sanitizeCollection(// @ts-expect-error
                {
                    ...config,
                    collections: [
                        {
                            ...collectionWithAuth,
                            fields
                        }
                    ]
                }, {
                    ...collectionWithAuth,
                    fields
                });
            }).rejects.toThrow(ReservedFieldName);
        });
        it('should not throw on a custom field', async ()=>{
            const fields = [
                {
                    name: 'customField',
                    type: 'text',
                    label: 'some-collection'
                }
            ];
            await expect(async ()=>{
                await sanitizeCollection(// @ts-expect-error
                {
                    ...config,
                    collections: [
                        {
                            ...collectionWithAuth,
                            fields
                        }
                    ]
                }, {
                    ...collectionWithAuth,
                    fields
                });
            }).not.toThrow();
        });
    });
});

//# sourceMappingURL=reservedFieldNames.spec.js.map