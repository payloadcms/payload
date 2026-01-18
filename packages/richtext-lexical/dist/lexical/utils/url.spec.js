import { describe, it, expect } from 'vitest';
import { absoluteRegExp, relativeOrAnchorRegExp, validateUrl } from './url.js';
describe('Lexical URL Regex Matchers', () => {
  describe('relativeOrAnchorRegExp', () => {
    it('validation for links it should match', async () => {
      const shouldMatch = ['/path/to/resource', '/file-name.html', '/', '/dir/', '/path.with.dots/', '#anchor', '#section-title', '/path#fragment', '/page?id=123', '/page?id=123#section', '/search?q=test', '/?global=true'];
      shouldMatch.forEach(testCase => {
        expect(relativeOrAnchorRegExp.test(testCase)).toBe(true);
      });
    });
    it('validation for links it should not match', async () => {
      const shouldNotMatch = ['match', 'http://example.com', 'relative/path', 'file.html', 'some#fragment', '#', '/#', '/path/with spaces', '', 'ftp://example.com'];
      shouldNotMatch.forEach(testCase => {
        expect(relativeOrAnchorRegExp.test(testCase)).not.toBe(true);
      });
    });
  });
  describe('absoluteRegExp', () => {
    it('validation for links it should match', async () => {
      const shouldMatch = ['http://example.com', 'https://example.com', 'ftp://files.example.com', 'http://example.com/resource', 'https://example.com/resource?key=value', 'http://example.com/resource#anchor', 'http://www.example.com', 'https://sub.example.com/path/file', 'mailto:email@example.com', 'tel:+1234567890', 'http://user:pass@example.com', 'www.example.com', 'www.example.com/resource', 'www.example.com/resource?query=1', 'www.example.com#fragment'];
      shouldMatch.forEach(testCase => {
        expect(absoluteRegExp.test(testCase)).toBe(true);
      });
    });
    it('validation for links it should not match', async () => {
      const shouldNotMatch = ['/relative/path', '#anchor', 'example.com', '://missing.scheme', 'http://', 'http:/example.com', 'ftp://example .com', 'http://example', 'not-a-url', 'http//example.com', 'https://example.com/ spaces'];
      shouldNotMatch.forEach(testCase => {
        expect(absoluteRegExp.test(testCase)).not.toBe(true);
      });
    });
  });
  describe('validateUrl', () => {
    describe('absolute URLs', () => {
      it('should validate http and https URLs', () => {
        const validUrls = ['http://example.com', 'https://example.com', 'http://www.example.com', 'https://sub.example.com/path/file', 'http://example.com/resource', 'https://example.com/resource?key=value', 'http://example.com/resource#anchor'];
        validUrls.forEach(url => {
          expect(validateUrl(url)).toBe(true);
        });
      });
      it('should validate other protocol URLs', () => {
        const validUrls = ['ftp://files.example.com', 'mailto:email@example.com', 'tel:+1234567890'];
        validUrls.forEach(url => {
          expect(validateUrl(url)).toBe(true);
        });
      });
      it('should validate www URLs without protocol', () => {
        const validUrls = ['www.example.com', 'www.example.com/resource', 'www.example.com/resource?query=1', 'www.example.com#fragment'];
        validUrls.forEach(url => {
          expect(validateUrl(url)).toBe(true);
        });
      });
    });
    describe('relative URLs', () => {
      it('should validate relative paths', () => {
        const validUrls = ['/path/to/resource', '/file-name.html', '/', '/dir/', '/path.with.dots/', '/path#fragment'];
        validUrls.forEach(url => {
          expect(validateUrl(url)).toBe(true);
        });
      });
    });
    describe('anchor links', () => {
      it('should validate anchor links', () => {
        const validUrls = ['#anchor', '#section-title'];
        validUrls.forEach(url => {
          expect(validateUrl(url)).toBe(true);
        });
      });
    });
    describe('with query params', () => {
      it('should validate relative URLs with query parameters', () => {
        const validUrls = ['/page?id=123', '/search?q=test', '/products?category=electronics&sort=price', '/path?key=value&another=param', '/page?id=123&filter=active', '/?global=true'];
        validUrls.forEach(url => {
          expect(validateUrl(url)).toBe(true);
        });
      });
      it('should validate absolute URLs with query parameters', () => {
        const validUrls = ['https://example.com?id=123', 'http://example.com/page?key=value', 'www.example.com?search=query', 'https://example.com/path?a=1&b=2&c=3'];
        validUrls.forEach(url => {
          expect(validateUrl(url)).toBe(true);
        });
      });
      it('should validate URLs with query parameters and anchors', () => {
        const validUrls = ['/page?id=123#section', 'https://example.com?key=value#anchor', '/search?q=test#results'];
        validUrls.forEach(url => {
          expect(validateUrl(url)).toBe(true);
        });
      });
    });
    describe('edge cases', () => {
      it('should handle the default https:// case', () => {
        expect(validateUrl('https://')).toBe(true);
      });
      it('should return false for empty or invalid URLs', () => {
        const invalidUrls = ['', 'not-a-url', 'example.com', 'relative/path', 'file.html', 'some#fragment', 'http://', 'http:/example.com', 'http//example.com'];
        invalidUrls.forEach(url => {
          expect(validateUrl(url)).toBe(false);
        });
      });
      it('should return false for URLs with spaces', () => {
        const invalidUrls = ['/path/with spaces', 'http://example.com/ spaces', 'https://example.com/path with spaces'];
        invalidUrls.forEach(url => {
          expect(validateUrl(url)).toBe(false);
        });
      });
      it('should return false for malformed URLs', () => {
        const invalidUrls = ['://missing.scheme', 'ftp://example .com', 'http://example', '#', '/#'];
        invalidUrls.forEach(url => {
          expect(validateUrl(url)).toBe(false);
        });
      });
    });
  });
});
//# sourceMappingURL=url.spec.js.map