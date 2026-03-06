import { describe, expect, it } from 'vitest'

import { fieldToRegex } from './fieldToRegex.js'

describe('fieldToRegex', () => {
  describe('simple field paths', () => {
    it('should match exact field name', () => {
      const regex = fieldToRegex('title')

      expect(regex.test('title')).toBe(true)
    })

    it('should match field with array index', () => {
      const regex = fieldToRegex('items')

      expect(regex.test('items_0')).toBe(true)
      expect(regex.test('items_1')).toBe(true)
      expect(regex.test('items_99')).toBe(true)
    })

    it('should match nested fields under array items', () => {
      const regex = fieldToRegex('items')

      expect(regex.test('items_0_title')).toBe(true)
      expect(regex.test('items_1_description')).toBe(true)
    })

    it('should not match unrelated fields', () => {
      const regex = fieldToRegex('title')

      expect(regex.test('otherField')).toBe(false)
      expect(regex.test('titleExtra')).toBe(false)
    })
  })

  describe('dotted field paths', () => {
    it('should match nested field path without indices', () => {
      const regex = fieldToRegex('blocks.content')

      expect(regex.test('blocks_content')).toBe(true)
    })

    it('should match nested field path with array index in middle', () => {
      const regex = fieldToRegex('blocks.content')

      expect(regex.test('blocks_0_content')).toBe(true)
      expect(regex.test('blocks_1_content')).toBe(true)
      expect(regex.test('blocks_42_content')).toBe(true)
    })

    it('should match deeply nested paths with multiple indices', () => {
      const regex = fieldToRegex('blocks.content.items')

      expect(regex.test('blocks_0_content_items')).toBe(true)
      expect(regex.test('blocks_0_content_0_items')).toBe(true)
      expect(regex.test('blocks_1_content_2_items')).toBe(true)
    })

    it('should match nested fields under the matched path', () => {
      const regex = fieldToRegex('blocks.content')

      expect(regex.test('blocks_0_content_title')).toBe(true)
      expect(regex.test('blocks_0_content_richText')).toBe(true)
      expect(regex.test('blocks_1_content_0_value')).toBe(true)
    })
  })

  describe('complex nested structures', () => {
    it('should handle three-level nesting', () => {
      const regex = fieldToRegex('layout.sections.items')

      expect(regex.test('layout_sections_items')).toBe(true)
      expect(regex.test('layout_0_sections_items')).toBe(true)
      expect(regex.test('layout_0_sections_1_items')).toBe(true)
      expect(regex.test('layout_0_sections_1_items_2')).toBe(true)
      expect(regex.test('layout_0_sections_1_items_2_title')).toBe(true)
    })

    it('should not match partial field name matches', () => {
      const regex = fieldToRegex('block')

      expect(regex.test('blocks')).toBe(false)
      expect(regex.test('blocks_0_content')).toBe(false)
      expect(regex.test('blockType')).toBe(false)
    })

    it('should handle field names that look like array indices', () => {
      const regex = fieldToRegex('data.row')

      expect(regex.test('data_row')).toBe(true)
      expect(regex.test('data_0_row')).toBe(true)
      expect(regex.test('data_0_row_1')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle single character field names', () => {
      const regex = fieldToRegex('a.b.c')

      expect(regex.test('a_b_c')).toBe(true)
      expect(regex.test('a_0_b_c')).toBe(true)
      expect(regex.test('a_0_b_1_c')).toBe(true)
    })

    it('should handle field names with numbers', () => {
      const regex = fieldToRegex('field1.field2')

      expect(regex.test('field1_field2')).toBe(true)
      expect(regex.test('field1_0_field2')).toBe(true)
    })

    it('should match field at end of key exactly', () => {
      const regex = fieldToRegex('meta.title')

      expect(regex.test('meta_title')).toBe(true)
      expect(regex.test('meta_0_title')).toBe(true)
      // Should not match if title is a prefix of another word
      expect(regex.test('meta_titleExtra')).toBe(false)
    })

    it('should handle field names starting with underscore', () => {
      const regex = fieldToRegex('_status')

      expect(regex.test('_status')).toBe(true)
      expect(regex.test('_status_0')).toBe(true)
      expect(regex.test('_statusExtra')).toBe(false)
    })

    it('should handle field names containing underscores', () => {
      const regex = fieldToRegex('my_field')

      expect(regex.test('my_field')).toBe(true)
      expect(regex.test('my_field_0')).toBe(true)
      expect(regex.test('my_fieldExtra')).toBe(false)
    })

    it('should handle nested paths with underscore fields', () => {
      const regex = fieldToRegex('group._status')

      expect(regex.test('group__status')).toBe(true)
      expect(regex.test('group_0__status')).toBe(true)
    })
  })

  describe('date fields with timezone companions', () => {
    it('should match date field and its _tz companion', () => {
      const regex = fieldToRegex('publishedDate')

      expect(regex.test('publishedDate')).toBe(true)
      expect(regex.test('publishedDate_tz')).toBe(true)
    })

    it('should match nested date field and its _tz companion', () => {
      const regex = fieldToRegex('meta.publishedDate')

      expect(regex.test('meta_publishedDate')).toBe(true)
      expect(regex.test('meta_publishedDate_tz')).toBe(true)
      expect(regex.test('meta_0_publishedDate')).toBe(true)
      expect(regex.test('meta_0_publishedDate_tz')).toBe(true)
    })

    it('should match date fields in arrays with _tz companions', () => {
      const regex = fieldToRegex('events.startDate')

      expect(regex.test('events_0_startDate')).toBe(true)
      expect(regex.test('events_0_startDate_tz')).toBe(true)
      expect(regex.test('events_1_startDate')).toBe(true)
      expect(regex.test('events_1_startDate_tz')).toBe(true)
    })

    it('should match deeply nested date fields with _tz companions', () => {
      const regex = fieldToRegex('blocks.content.scheduledAt')

      expect(regex.test('blocks_0_content_scheduledAt')).toBe(true)
      expect(regex.test('blocks_0_content_scheduledAt_tz')).toBe(true)
      expect(regex.test('blocks_0_content_0_scheduledAt')).toBe(true)
      expect(regex.test('blocks_0_content_0_scheduledAt_tz')).toBe(true)
    })

    it('should not match _tz suffix on unrelated fields', () => {
      const regex = fieldToRegex('title')

      expect(regex.test('title')).toBe(true)
      expect(regex.test('title_tz')).toBe(true) // _tz is treated as a nested field suffix
      expect(regex.test('publishedDate_tz')).toBe(false)
    })

    it('should handle date fields with underscores in name', () => {
      const regex = fieldToRegex('start_date')

      expect(regex.test('start_date')).toBe(true)
      expect(regex.test('start_date_tz')).toBe(true)
      expect(regex.test('start_date_0')).toBe(true)
    })
  })
})
