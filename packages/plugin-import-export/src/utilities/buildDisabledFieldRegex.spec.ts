import { describe, expect, it } from 'vitest'

import { buildDisabledFieldRegex } from './buildDisabledFieldRegex.js'

describe('buildDisabledFieldRegex', () => {
  describe('simple field paths', () => {
    it('should match exact field name', () => {
      const matcher = buildDisabledFieldRegex('title')

      expect(matcher.test('title')).toBe(true)
    })

    it('should match field with array index', () => {
      const matcher = buildDisabledFieldRegex('items')

      expect(matcher.test('items_0')).toBe(true)
      expect(matcher.test('items_1')).toBe(true)
    })

    it('should match nested fields under array items', () => {
      const matcher = buildDisabledFieldRegex('items')

      expect(matcher.test('items_0_title')).toBe(true)
    })

    it('should not match unrelated fields', () => {
      const matcher = buildDisabledFieldRegex('title')

      expect(matcher.test('otherField')).toBe(false)
      expect(matcher.test('titleExtra')).toBe(false)
    })
  })

  describe('block type slug handling', () => {
    it('should match field path with block type slug', () => {
      const matcher = buildDisabledFieldRegex('blocks.content')

      // Standard cases
      expect(matcher.test('blocks_content')).toBe(true)
      expect(matcher.test('blocks_0_content')).toBe(true)

      // With block type slug (hero, cta, etc.)
      expect(matcher.test('blocks_0_hero_content')).toBe(true)
      expect(matcher.test('blocks_1_cta_content')).toBe(true)
      expect(matcher.test('blocks_hero_content')).toBe(true)
    })

    it('should match nested fields within blocks', () => {
      const matcher = buildDisabledFieldRegex('blocks.content')

      expect(matcher.test('blocks_0_hero_content_title')).toBe(true)
      expect(matcher.test('blocks_0_content_richText')).toBe(true)
    })
  })

  describe('deeply nested paths', () => {
    it('should match three-level nesting with indices and slugs', () => {
      const matcher = buildDisabledFieldRegex('layout.sections.items')

      expect(matcher.test('layout_sections_items')).toBe(true)
      expect(matcher.test('layout_0_sections_items')).toBe(true)
      expect(matcher.test('layout_0_sections_1_items')).toBe(true)
      expect(matcher.test('layout_0_hero_sections_1_items')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should not match partial field names', () => {
      const matcher = buildDisabledFieldRegex('block')

      expect(matcher.test('blocks')).toBe(false)
      expect(matcher.test('blockType')).toBe(false)
    })

    it('should handle field names with numbers', () => {
      const matcher = buildDisabledFieldRegex('field1.field2')

      expect(matcher.test('field1_field2')).toBe(true)
      expect(matcher.test('field1_0_field2')).toBe(true)
    })
  })
})
