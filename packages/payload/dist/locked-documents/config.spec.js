import { describe, it, expect } from 'vitest';
import { getLockedDocumentsCollection } from './config.js';
describe('getLockedDocumentsCollection', ()=>{
    it('should return null when no lockable collections or globals exist', ()=>{
        const config = {
            collections: [
                {
                    slug: 'posts',
                    lockDocuments: false,
                    fields: []
                },
                {
                    slug: 'pages',
                    lockDocuments: false,
                    fields: []
                }
            ],
            globals: [
                {
                    slug: 'settings',
                    lockDocuments: false,
                    fields: []
                }
            ]
        };
        const result = getLockedDocumentsCollection(config);
        expect(result).toBeNull();
    });
    it('should return null when no auth collections exist', ()=>{
        const config = {
            collections: [
                {
                    slug: 'posts',
                    lockDocuments: true,
                    fields: []
                },
                {
                    slug: 'pages',
                    lockDocuments: {
                        duration: 600
                    },
                    fields: []
                }
            ]
        };
        const result = getLockedDocumentsCollection(config);
        expect(result).toBeNull();
    });
    it('should return collection config when lockable and auth collections exist', ()=>{
        const config = {
            collections: [
                {
                    slug: 'posts',
                    lockDocuments: true,
                    fields: []
                },
                {
                    slug: 'pages',
                    lockDocuments: {
                        duration: 600
                    },
                    fields: []
                },
                {
                    slug: 'users',
                    auth: true,
                    fields: []
                }
            ]
        };
        const result = getLockedDocumentsCollection(config);
        expect(result).not.toBeNull();
        expect(result?.slug).toBe('payload-locked-documents');
        expect(result?.fields).toHaveLength(3);
        // Check document field
        const documentField = result?.fields.find((f)=>'name' in f && f.name === 'document');
        expect(documentField).toBeDefined();
        expect(documentField?.type).toBe('relationship');
        if (documentField?.type === 'relationship') {
            expect(documentField.relationTo).toEqual([
                'posts',
                'pages',
                'users'
            ]);
        }
        // Check user field
        const userField = result?.fields.find((f)=>'name' in f && f.name === 'user');
        expect(userField).toBeDefined();
        expect(userField?.type).toBe('relationship');
        if (userField?.type === 'relationship') {
            expect(userField.relationTo).toEqual([
                'users'
            ]);
        }
    });
    it('should only include collections with lockDocuments !== false', ()=>{
        const config = {
            collections: [
                {
                    slug: 'posts',
                    lockDocuments: true,
                    fields: []
                },
                {
                    slug: 'pages',
                    lockDocuments: false,
                    fields: []
                },
                {
                    slug: 'articles',
                    // lockDocuments undefined (defaults to true)
                    fields: []
                },
                {
                    slug: 'users',
                    auth: true,
                    fields: []
                }
            ]
        };
        const result = getLockedDocumentsCollection(config);
        expect(result).not.toBeNull();
        const documentField = result?.fields.find((f)=>'name' in f && f.name === 'document');
        if (documentField?.type === 'relationship') {
            expect(documentField.relationTo).toEqual([
                'posts',
                'articles',
                'users'
            ]);
            expect(documentField.relationTo).not.toContain('pages');
        }
    });
    it('should include multiple auth collections', ()=>{
        const config = {
            collections: [
                {
                    slug: 'posts',
                    lockDocuments: true,
                    fields: []
                },
                {
                    slug: 'users',
                    auth: true,
                    fields: []
                },
                {
                    slug: 'admins',
                    auth: {
                        loginWithUsername: true
                    },
                    fields: []
                }
            ]
        };
        const result = getLockedDocumentsCollection(config);
        expect(result).not.toBeNull();
        const userField = result?.fields.find((f)=>'name' in f && f.name === 'user');
        if (userField?.type === 'relationship') {
            expect(userField.relationTo).toEqual([
                'users',
                'admins'
            ]);
        }
    });
    it('should set lockDocuments to false on the locked-documents collection itself', ()=>{
        const config = {
            collections: [
                {
                    slug: 'posts',
                    lockDocuments: true,
                    fields: []
                },
                {
                    slug: 'users',
                    auth: true,
                    fields: []
                }
            ]
        };
        const result = getLockedDocumentsCollection(config);
        expect(result).not.toBeNull();
        expect(result?.lockDocuments).toBe(false);
    });
    it('should create collection when only globals have lockDocuments enabled', ()=>{
        const config = {
            collections: [
                {
                    slug: 'posts',
                    lockDocuments: false,
                    fields: []
                },
                {
                    slug: 'users',
                    auth: true,
                    lockDocuments: false,
                    fields: []
                }
            ],
            globals: [
                {
                    slug: 'settings',
                    lockDocuments: true,
                    fields: []
                },
                {
                    slug: 'menu',
                    lockDocuments: {
                        duration: 600
                    },
                    fields: []
                }
            ]
        };
        const result = getLockedDocumentsCollection(config);
        expect(result).not.toBeNull();
        expect(result?.slug).toBe('payload-locked-documents');
        // Should NOT have a document field since no lockable collections
        const documentField = result?.fields.find((f)=>'name' in f && f.name === 'document');
        expect(documentField).toBeUndefined();
        // Should have globalSlug field
        const globalSlugField = result?.fields.find((f)=>'name' in f && f.name === 'globalSlug');
        expect(globalSlugField).toBeDefined();
        // Should have user field
        const userField = result?.fields.find((f)=>'name' in f && f.name === 'user');
        expect(userField).toBeDefined();
    });
    it('should include document field when lockable collections exist', ()=>{
        const config = {
            collections: [
                {
                    slug: 'posts',
                    lockDocuments: true,
                    fields: []
                },
                {
                    slug: 'users',
                    auth: true,
                    fields: []
                }
            ],
            globals: [
                {
                    slug: 'settings',
                    lockDocuments: false,
                    fields: []
                }
            ]
        };
        const result = getLockedDocumentsCollection(config);
        expect(result).not.toBeNull();
        // Should have document field
        const documentField = result?.fields.find((f)=>'name' in f && f.name === 'document');
        expect(documentField).toBeDefined();
        expect(documentField?.type).toBe('relationship');
        if (documentField?.type === 'relationship') {
            expect(documentField.relationTo).toEqual([
                'posts',
                'users'
            ]);
        }
        // Should have globalSlug field
        const globalSlugField = result?.fields.find((f)=>'name' in f && f.name === 'globalSlug');
        expect(globalSlugField).toBeDefined();
    });
    it('should include document field when both lockable collections and globals exist', ()=>{
        const config = {
            collections: [
                {
                    slug: 'posts',
                    lockDocuments: true,
                    fields: []
                },
                {
                    slug: 'users',
                    auth: true,
                    fields: []
                }
            ],
            globals: [
                {
                    slug: 'settings',
                    lockDocuments: true,
                    fields: []
                }
            ]
        };
        const result = getLockedDocumentsCollection(config);
        expect(result).not.toBeNull();
        // Should have document field for collections
        const documentField = result?.fields.find((f)=>'name' in f && f.name === 'document');
        expect(documentField).toBeDefined();
        // Should have globalSlug field for globals
        const globalSlugField = result?.fields.find((f)=>'name' in f && f.name === 'globalSlug');
        expect(globalSlugField).toBeDefined();
    });
});

//# sourceMappingURL=config.spec.js.map