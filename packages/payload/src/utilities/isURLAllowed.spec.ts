import { describe, expect, it } from 'vitest'

import type { AllowList } from '../uploads/types.js'

import { isURLAllowed } from './isURLAllowed.js'

describe('isURLAllowed', () => {
  describe('hostname matching', () => {
    const allowList: AllowList = [{ hostname: 'cdn.example.com' }]

    it('should allow an exactly matching hostname', () => {
      expect(isURLAllowed('https://cdn.example.com/file.png', allowList)).toBe(true)
    })

    it('should deny a different hostname', () => {
      expect(isURLAllowed('https://attacker.com/file.png', allowList)).toBe(false)
    })

    it('should deny a userinfo `@` trick (hostname is the real authority)', () => {
      expect(isURLAllowed('https://cdn.example.com@attacker.com/file.png', allowList)).toBe(false)
    })

    it('should deny an invalid URL', () => {
      expect(isURLAllowed('not a url', allowList)).toBe(false)
    })
  })

  describe('pathname matching', () => {
    it('should treat a literal dot as a literal, not a wildcard', () => {
      const allowList: AllowList = [{ hostname: 'cdn.example.com', pathname: '/files/report.json' }]

      expect(isURLAllowed('https://cdn.example.com/files/report.json', allowList)).toBe(true)
      // Previously the unescaped `.` matched any character, widening the allow-list.
      expect(isURLAllowed('https://cdn.example.com/files/reportXjson', allowList)).toBe(false)
    })

    it('should not let other regex metacharacters broaden the match', () => {
      const allowList: AllowList = [{ hostname: 'cdn.example.com', pathname: '/a+b/(c)' }]

      expect(isURLAllowed('https://cdn.example.com/a+b/(c)', allowList)).toBe(true)
      expect(isURLAllowed('https://cdn.example.com/aaab/c', allowList)).toBe(false)
    })

    it('should match a single segment with `*` but not across slashes', () => {
      const allowList: AllowList = [{ hostname: 'cdn.example.com', pathname: '/uploads/*' }]

      expect(isURLAllowed('https://cdn.example.com/uploads/photo.png', allowList)).toBe(true)
      expect(isURLAllowed('https://cdn.example.com/uploads/nested/photo.png', allowList)).toBe(
        false,
      )
    })

    it('should match across slashes with `**`', () => {
      const allowList: AllowList = [{ hostname: 'cdn.example.com', pathname: '/uploads/**' }]

      expect(isURLAllowed('https://cdn.example.com/uploads/photo.png', allowList)).toBe(true)
      expect(isURLAllowed('https://cdn.example.com/uploads/nested/photo.png', allowList)).toBe(true)
    })

    it('should allow an optional trailing slash', () => {
      const allowList: AllowList = [{ hostname: 'cdn.example.com', pathname: '/assets/' }]

      expect(isURLAllowed('https://cdn.example.com/assets', allowList)).toBe(true)
      expect(isURLAllowed('https://cdn.example.com/assets/', allowList)).toBe(true)
    })
  })
})
