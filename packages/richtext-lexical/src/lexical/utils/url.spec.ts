import { jest } from '@jest/globals'
import { absoluteRegExp, relativeOrAnchorRegExp } from './url.js'

describe('Lexical URL Regex Matchers', () => {
  describe('relative URLs', () => {
    it('validation for links it should match', async () => {
      const shouldMatch = [
        '/path/to/resource',
        '/file-name.html',
        '/',
        '/dir/',
        '/path.with.dots/',
        '#anchor',
        '#section-title',
        '/path#fragment',
      ]

      shouldMatch.forEach((testCase) => {
        expect(relativeOrAnchorRegExp.test(testCase)).toBe(true)
      })
    })

    it('validation for links it should not match', async () => {
      const shouldNotMatch = [
        'match',
        'http://example.com',
        'relative/path',
        'file.html',
        'some#fragment',
        '#',
        '/#',
        '/path/with spaces',
        '',
        'ftp://example.com',
      ]

      shouldNotMatch.forEach((testCase) => {
        expect(relativeOrAnchorRegExp.test(testCase)).not.toBe(true)
      })
    })
  })

  describe('absolute URLs', () => {
    it('validation for links it should match', async () => {
      const shouldMatch = [
        'http://example.com',
        'https://example.com',
        'ftp://files.example.com',
        'http://example.com/resource',
        'https://example.com/resource?key=value',
        'http://example.com/resource#anchor',
        'http://www.example.com',
        'https://sub.example.com/path/file',
        'mailto:email@example.com',
        'tel:+1234567890',
        'http://user:pass@example.com',
        'www.example.com',
        'www.example.com/resource',
        'www.example.com/resource?query=1',
        'www.example.com#fragment',
      ]

      shouldMatch.forEach((testCase) => {
        expect(absoluteRegExp.test(testCase)).toBe(true)
      })
    })

    it('validation for links it should not match', async () => {
      const shouldNotMatch = [
        '/relative/path',
        '#anchor',
        'example.com',
        '://missing.scheme',
        'http://',
        'http:/example.com',
        'ftp://example .com',
        'http://example',
        'not-a-url',
        'http//example.com',
        'https://example.com/ spaces',
      ]

      shouldNotMatch.forEach((testCase) => {
        expect(absoluteRegExp.test(testCase)).not.toBe(true)
      })
    })
  })
})
