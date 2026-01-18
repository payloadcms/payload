import { describe, it, expect } from 'vitest';
import { getSafeRedirect } from './getSafeRedirect';
const fallback = '/admin' // default fallback if the input is unsafe or invalid
;
describe('getSafeRedirect', ()=>{
    // Valid - safe redirect paths
    it.each([
        [
            '/dashboard'
        ],
        [
            '/admin/settings'
        ],
        [
            '/projects?id=123'
        ],
        [
            '/hello-world'
        ]
    ])('should allow safe relative path: %s', (input)=>{
        // If the input is a clean relative path, it should be returned as-is
        expect(getSafeRedirect({
            redirectTo: input,
            fallbackTo: fallback
        })).toBe(input);
    });
    // Invalid types or empty inputs
    it.each([
        '',
        null,
        undefined,
        123,
        {},
        []
    ])('should fallback on invalid or non-string input: %s', (input)=>{
        // If the input is not a valid string, it should return the fallback
        expect(getSafeRedirect({
            redirectTo: input,
            fallbackTo: fallback
        })).toBe(fallback);
    });
    // Unsafe redirect patterns
    it.each([
        '//example.com',
        '/javascript:alert(1)',
        '/JavaScript:alert(1)',
        '/http://unknown.com',
        '/https://unknown.com',
        '/%2Funknown.com',
        '/\\/unknown.com',
        '/\\\\unknown.com',
        '/\\unknown.com',
        '%2F%2Funknown.com',
        '%2Fjavascript:alert(1)'
    ])('should block unsafe redirect: %s', (input)=>{
        // All of these should return the fallback because they’re unsafe
        expect(getSafeRedirect({
            redirectTo: input,
            fallbackTo: fallback
        })).toBe(fallback);
    });
    // Input with extra spaces should still be properly handled
    it('should trim whitespace before evaluating', ()=>{
        // A valid path with surrounding spaces should still be accepted
        expect(getSafeRedirect({
            redirectTo: '   /dashboard   ',
            fallbackTo: fallback
        })).toBe('/dashboard');
        // An unsafe path with spaces should still be rejected
        expect(getSafeRedirect({
            redirectTo: '   //example.com   ',
            fallbackTo: fallback
        })).toBe(fallback);
    });
    // If decoding the input fails (e.g., invalid percent encoding), it should not crash
    it('should return fallback on invalid encoding', ()=>{
        expect(getSafeRedirect({
            redirectTo: '%E0%A4%A',
            fallbackTo: fallback
        })).toBe(fallback);
    });
});

//# sourceMappingURL=getSafeRedirect.spec.js.map