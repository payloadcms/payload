import { describe, it, expect } from 'vitest';
import { formatAdminURL } from './formatAdminURL.js';
describe('formatAdminURL', ()=>{
    const serverURL = 'https://example.com';
    const defaultAdminRoute = '/admin';
    const rootAdminRoute = '/';
    const dummyPath = '/collections/posts';
    describe('relative URLs', ()=>{
        it('should ignore `serverURL` when relative=true', ()=>{
            const result = formatAdminURL({
                adminRoute: defaultAdminRoute,
                path: dummyPath,
                serverURL,
                relative: true
            });
            expect(result).toBe(`${defaultAdminRoute}${dummyPath}`);
        });
        it('should force relative URL when `serverURL` is omitted', ()=>{
            const result = formatAdminURL({
                adminRoute: defaultAdminRoute,
                path: dummyPath,
                relative: false
            });
            expect(result).toBe(`${defaultAdminRoute}${dummyPath}`);
        });
    });
    describe('absolute URLs', ()=>{
        it('should return absolute URL with serverURL', ()=>{
            const result = formatAdminURL({
                adminRoute: defaultAdminRoute,
                path: dummyPath,
                serverURL
            });
            expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}${dummyPath}`);
        });
        it('should handle serverURL with trailing slash', ()=>{
            const result = formatAdminURL({
                adminRoute: defaultAdminRoute,
                path: '/collections/posts',
                serverURL: 'https://example.com/'
            });
            expect(result).toBe(`https://example.com${process.env.NEXT_BASE_PATH || ''}/admin/collections/posts`);
        });
        it('should handle serverURL with subdirectory', ()=>{
            const result = formatAdminURL({
                adminRoute: defaultAdminRoute,
                path: '/collections/posts',
                serverURL: 'https://example.com/api/v1'
            });
            expect(result).toBe(`https://example.com${process.env.NEXT_BASE_PATH || ''}/admin/collections/posts`);
        });
    });
    describe('admin route handling', ()=>{
        it('should return relative URL for adminRoute="/", no path, no `serverURL`', ()=>{
            const result = formatAdminURL({
                adminRoute: rootAdminRoute
            });
            expect(result).toBe('/');
        });
        it('should handle relative URL for adminRoute="/", with path, no `serverURL`', ()=>{
            const result = formatAdminURL({
                adminRoute: rootAdminRoute,
                path: dummyPath
            });
            expect(result).toBe(dummyPath);
        });
        it('should return absolute URL for adminRoute="/", no path, with `serverURL`', ()=>{
            const result = formatAdminURL({
                adminRoute: rootAdminRoute,
                serverURL
            });
            expect(result).toBe('https://example.com/');
        });
        it('should handle absolute URL for adminRoute="/", with path and `serverURL`', ()=>{
            const result = formatAdminURL({
                adminRoute: rootAdminRoute,
                serverURL,
                path: dummyPath
            });
            expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}${dummyPath}`);
        });
    });
    describe('base path handling', ()=>{
        it('should include basePath in URL', ()=>{
            const result = formatAdminURL({
                adminRoute: defaultAdminRoute,
                basePath: '/v1',
                path: dummyPath,
                serverURL
            });
            expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}/v1${defaultAdminRoute}${dummyPath}`);
        });
        it('should handle basePath with adminRoute="/"', ()=>{
            const result = formatAdminURL({
                adminRoute: rootAdminRoute,
                basePath: '/v1',
                serverURL
            });
            expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}/v1`);
        });
        it('should handle basePath with no adminRoute', ()=>{
            const result = formatAdminURL({
                adminRoute: undefined,
                basePath: '/v1',
                path: dummyPath,
                serverURL
            });
            expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}/v1${dummyPath}`);
        });
        it('should handle empty basePath', ()=>{
            const result = formatAdminURL({
                adminRoute: defaultAdminRoute,
                basePath: '',
                path: dummyPath,
                serverURL
            });
            expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}${dummyPath}`);
        });
    });
    describe('path handling', ()=>{
        it('should handle empty string path', ()=>{
            const result = formatAdminURL({
                adminRoute: defaultAdminRoute,
                path: '',
                serverURL
            });
            expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}`);
        });
        it('should handle null path', ()=>{
            const result = formatAdminURL({
                adminRoute: defaultAdminRoute,
                path: null,
                serverURL
            });
            expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}`);
        });
        it('should handle undefined path', ()=>{
            const result = formatAdminURL({
                adminRoute: defaultAdminRoute,
                path: undefined,
                serverURL
            });
            expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}`);
        });
        it('should handle path with query parameters', ()=>{
            const path = `${dummyPath}?page=2`;
            const result = formatAdminURL({
                adminRoute: defaultAdminRoute,
                path,
                serverURL
            });
            expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}${path}`);
        });
    });
    describe('edge cases', ()=>{
        it('should return "/" when given minimal args', ()=>{
            const result = formatAdminURL({
                adminRoute: undefined,
                basePath: '',
                path: '',
                relative: true
            });
            expect(result).toBe('/');
        });
    });
});

//# sourceMappingURL=formatAdminURL.spec.js.map