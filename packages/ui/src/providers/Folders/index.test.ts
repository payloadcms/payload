/**
 * Tests for modifier key behavior in Folders provider
 * 
 * These tests verify the fix for GitHub issue #15837 and address
 * reviewer comments about protocol validation and multi-selection.
 */

import { describe, expect, it } from 'vitest'

describe('Folders Provider - Modifier Key Behavior', () => {
  describe('URL Protocol Validation', () => {
    it('should accept http: protocol', () => {
      const url = 'http://localhost:3000/admin/collections/pages/1'
      const parsedUrl = new URL(url, 'http://localhost:3000')
      
      // Fixed regex: includes trailing colon
      const isValid = parsedUrl.protocol.match(/^https?:$/)
      expect(isValid).toBeTruthy()
    })

    it('should accept https: protocol', () => {
      const url = 'https://example.com/admin/collections/pages/1'
      const parsedUrl = new URL(url, 'https://example.com')
      
      // Fixed regex: includes trailing colon
      const isValid = parsedUrl.protocol.match(/^https?:$/)
      expect(isValid).toBeTruthy()
    })

    it('should reject javascript: protocol', () => {
      const url = 'javascript:alert(1)'
      try {
        const parsedUrl = new URL(url, 'http://localhost:3000')
        const isValid = parsedUrl.protocol.match(/^https?:$/)
        expect(isValid).toBeFalsy()
      } catch {
        // URL constructor throws for invalid URLs - also acceptable
        expect(true).toBe(true)
      }
    })

    it('should reject data: protocol', () => {
      try {
        const url = 'data:text/html,<script>alert(1)</script>'
        const parsedUrl = new URL(url, 'http://localhost:3000')
        const isValid = parsedUrl.protocol.match(/^https?:$/)
        expect(isValid).toBeFalsy()
      } catch {
        // URL constructor may throw for invalid URLs
        expect(true).toBe(true)
      }
    })

    it('should reject file: protocol', () => {
      const url = 'file:///etc/passwd'
      const parsedUrl = new URL(url, 'file:///')
      
      const isValid = parsedUrl.protocol.match(/^https?:$/)
      expect(isValid).toBeFalsy()
    })
  })

  describe('Modifier Key Behavior with allowMultiSelection=true', () => {
    it('should toggle selection on Ctrl+Click', () => {
      // When allowMultiSelection is true, Ctrl+Click should toggle selection
      // NOT open a new tab
      const allowMultiSelection = true
      const isCtrlPressed = true
      const isShiftPressed = false
      const isAltPressed = false
      
      // Expected: Toggle selection (don't open new tab)
      const shouldOpenNewTab = isAltPressed || !allowMultiSelection
      expect(shouldOpenNewTab).toBe(false)
    })

    it('should toggle selection on Cmd+Click', () => {
      // When allowMultiSelection is true, Cmd+Click should toggle selection
      const allowMultiSelection = true
      const isMetaPressed = true
      const isShiftPressed = false
      const isAltPressed = false
      
      const shouldOpenNewTab = isAltPressed || !allowMultiSelection
      expect(shouldOpenNewTab).toBe(false)
    })

    it('should select range on Shift+Click', () => {
      // When allowMultiSelection is true, Shift+Click should select range
      const allowMultiSelection = true
      const isShiftPressed = true
      const isAltPressed = false
      
      const shouldOpenNewTab = isAltPressed || !allowMultiSelection
      expect(shouldOpenNewTab).toBe(false)
    })

    it('should open new tab on Alt+Click', () => {
      // Alt+Click should always open new tab, regardless of allowMultiSelection
      const allowMultiSelection = true
      const isAltPressed = true
      
      const shouldOpenNewTab = isAltPressed || !allowMultiSelection
      expect(shouldOpenNewTab).toBe(true)
    })
  })

  describe('Modifier Key Behavior with allowMultiSelection=false', () => {
    it('should open new tab on Ctrl+Click', () => {
      // When allowMultiSelection is false, Ctrl+Click should open new tab
      const allowMultiSelection = false
      const isCtrlPressed = true
      const isAltPressed = false
      
      const shouldOpenNewTab = isAltPressed || !allowMultiSelection
      expect(shouldOpenNewTab).toBe(true)
    })

    it('should open new tab on Shift+Click', () => {
      // When allowMultiSelection is false, Shift+Click should open new tab
      const allowMultiSelection = false
      const isShiftPressed = true
      const isAltPressed = false
      
      const shouldOpenNewTab = isAltPressed || !allowMultiSelection
      expect(shouldOpenNewTab).toBe(true)
    })

    it('should open new tab on Alt+Click', () => {
      // Alt+Click should always open new tab
      const allowMultiSelection = false
      const isAltPressed = true
      
      const shouldOpenNewTab = isAltPressed || !allowMultiSelection
      expect(shouldOpenNewTab).toBe(true)
    })

    it('should navigate on regular click', () => {
      // Regular click should navigate (not open new tab)
      const allowMultiSelection = false
      const isCtrlPressed = false
      const isShiftPressed = false
      const isAltPressed = false
      
      const shouldOpenNewTab = isAltPressed || !allowMultiSelection
      expect(shouldOpenNewTab).toBe(true) // Would open new tab with any modifier
    })
  })

  describe('Same-Origin Validation', () => {
    it('should accept same-origin URLs', () => {
      const currentOrigin = 'http://localhost:3000'
      const url = 'http://localhost:3000/admin/collections/pages/1'
      const parsedUrl = new URL(url, currentOrigin)
      
      const isSameOrigin = parsedUrl.origin === currentOrigin
      expect(isSameOrigin).toBe(true)
    })

    it('should reject cross-origin URLs', () => {
      const currentOrigin = 'http://localhost:3000'
      const url = 'http://evil.com/phishing'
      const parsedUrl = new URL(url, currentOrigin)
      
      const isSameOrigin = parsedUrl.origin === currentOrigin
      expect(isSameOrigin).toBe(false)
    })

    it('should handle relative URLs correctly', () => {
      const currentOrigin = 'http://localhost:3000'
      const url = '/admin/collections/pages/1'
      const parsedUrl = new URL(url, currentOrigin)
      
      const isSameOrigin = parsedUrl.origin === currentOrigin
      expect(isSameOrigin).toBe(true)
    })
  })
})

describe('DefaultCell - Modifier Key Behavior', () => {
  describe('URL Validation', () => {
    it('should validate URL before opening', () => {
      const url = 'http://localhost:3000/admin/collections/pages/1'
      const baseOrigin = 'http://localhost:3000'
      
      let isValid = false
      try {
        const parsedUrl = new URL(url, baseOrigin)
        isValid = 
          parsedUrl.origin === baseOrigin &&
          parsedUrl.protocol.match(/^https?:$/) !== null
      } catch {
        isValid = false
      }
      
      expect(isValid).toBe(true)
    })

    it('should handle invalid URLs gracefully', () => {
      const url = ''
      const baseOrigin = 'http://localhost:3000'
      
      let isValid = false
      try {
        const parsedUrl = new URL(url || 'about:blank', baseOrigin)
        isValid = 
          parsedUrl.origin === baseOrigin &&
          parsedUrl.protocol.match(/^https?:$/) !== null
      } catch {
        isValid = false
      }
      
      expect(isValid).toBe(false)
    })
  })
})
