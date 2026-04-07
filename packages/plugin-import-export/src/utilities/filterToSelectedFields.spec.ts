import { describe, expect, it } from 'vitest'

import { filterToSelectedFields } from './getSchemaColumns.js'

describe('filterToSelectedFields', () => {
  describe('fields with their own column', () => {
    it('should include only the exact column for a date with timezones field', () => {
      const columns = ['id', 'title', 'dateWithTimezone', 'dateWithTimezone_tz', 'createdAt']

      const result = filterToSelectedFields(columns, ['title'])

      expect(result).toEqual(['title'])
    })

    it('should not include timezone companion when only date field is selected', () => {
      const columns = ['id', 'dateWithTimezone', 'dateWithTimezone_tz', 'createdAt']

      const result = filterToSelectedFields(columns, ['dateWithTimezone'])

      expect(result).toEqual(['dateWithTimezone'])
      expect(result).not.toContain('dateWithTimezone_tz')
    })

    it('should include both date and timezone companion when both are explicitly selected', () => {
      const columns = ['id', 'dateWithTimezone', 'dateWithTimezone_tz', 'createdAt']

      const result = filterToSelectedFields(columns, ['dateWithTimezone', 'dateWithTimezone_tz'])

      expect(result).toEqual(['dateWithTimezone', 'dateWithTimezone_tz'])
    })

    it('should preserve user-specified ordering', () => {
      const columns = ['id', 'title', 'email', 'createdAt']

      const result = filterToSelectedFields(columns, ['email', 'title', 'id'])

      expect(result).toEqual(['email', 'title', 'id'])
    })
  })

  describe('fields without their own column (groups, arrays, blocks)', () => {
    it('should expand a group to include its nested fields', () => {
      const columns = ['id', 'group_name', 'group_age', 'createdAt']

      const result = filterToSelectedFields(columns, ['group'])

      expect(result).toEqual(['group_name', 'group_age'])
    })

    it('should expand an array to include its nested fields', () => {
      const columns = ['id', 'items_0_title', 'items_0_value', 'createdAt']

      const result = filterToSelectedFields(columns, ['items'])

      expect(result).toEqual(['items_0_title', 'items_0_value'])
    })

    it('should expand blocks to include their nested fields', () => {
      const columns = ['id', 'blocks_0_hero_blockType', 'blocks_0_hero_title', 'createdAt']

      const result = filterToSelectedFields(columns, ['blocks'])

      expect(result).toEqual(['blocks_0_hero_blockType', 'blocks_0_hero_title'])
    })

    it('should expand a hasMany select to include indexed columns', () => {
      const columns = ['id', 'colors_0', 'createdAt']

      const result = filterToSelectedFields(columns, ['colors'])

      expect(result).toEqual(['colors_0'])
    })

    it('should expand a polymorphic relationship to include relationTo and id columns', () => {
      const columns = ['id', 'relField_relationTo', 'relField_id', 'createdAt']

      const result = filterToSelectedFields(columns, ['relField'])

      expect(result).toEqual(['relField_relationTo', 'relField_id'])
    })
  })

  describe('nested field selections with dot notation', () => {
    it('should resolve a specific nested field within a group', () => {
      const columns = ['id', 'group_name', 'group_age', 'createdAt']

      const result = filterToSelectedFields(columns, ['group.name'])

      expect(result).toEqual(['group_name'])
      expect(result).not.toContain('group_age')
    })
  })

  describe('mixed selections', () => {
    it('should handle groups and date fields together without sibling leakage', () => {
      const columns = [
        'id',
        'title',
        'group_name',
        'group_age',
        'dateWithTimezone',
        'dateWithTimezone_tz',
        'createdAt',
      ]

      const result = filterToSelectedFields(columns, ['id', 'group', 'dateWithTimezone'])

      expect(result).toEqual(['id', 'group_name', 'group_age', 'dateWithTimezone'])
      expect(result).not.toContain('dateWithTimezone_tz')
    })

    it('should not produce duplicates when a group and its nested field are both selected', () => {
      const columns = ['id', 'group_name', 'group_age']

      const result = filterToSelectedFields(columns, ['group', 'group.name'])

      const uniqueResult = [...new Set(result)]

      expect(result).toEqual(uniqueResult)
    })
  })
})
