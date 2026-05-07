import { describe, expect, it } from 'vitest'

import { formatUtcOffset } from './formatUtcOffset.js'

describe('formatUtcOffset', () => {
  describe('valid UTC offsets', () => {
    it.each([
      ['+00:00', '_TZOFFSET_PLUS_00_00'],
      ['+05:30', '_TZOFFSET_PLUS_05_30'],
      ['+05:45', '_TZOFFSET_PLUS_05_45'],
      ['+08:00', '_TZOFFSET_PLUS_08_00'],
      ['+09:30', '_TZOFFSET_PLUS_09_30'],
      ['+12:00', '_TZOFFSET_PLUS_12_00'],
      ['+14:00', '_TZOFFSET_PLUS_14_00'],
    ])('should convert positive offset %s to %s', (offset, expected) => {
      expect(formatUtcOffset(offset)).toEqual(expected)
    })

    it.each([
      ['-00:00', '_TZOFFSET_MINUS_00_00'],
      ['-03:30', '_TZOFFSET_MINUS_03_30'],
      ['-05:00', '_TZOFFSET_MINUS_05_00'],
      ['-08:00', '_TZOFFSET_MINUS_08_00'],
      ['-09:30', '_TZOFFSET_MINUS_09_30'],
      ['-12:00', '_TZOFFSET_MINUS_12_00'],
    ])('should convert negative offset %s to %s', (offset, expected) => {
      expect(formatUtcOffset(offset)).toEqual(expected)
    })
  })

  describe('non-offset values', () => {
    it.each(['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Pacific/Auckland'])(
      'should return null for IANA timezone: %s',
      (timezone) => {
        expect(formatUtcOffset(timezone)).toBeNull()
      },
    )

    it.each(['+5', '-8', '+05', '-08', '+0530', '-0800', '05:30', '0530', 'invalid', ''])(
      'should return null for non-standard format: %s',
      (value) => {
        expect(formatUtcOffset(value)).toBeNull()
      },
    )
  })

  describe('uniqueness', () => {
    it('should produce unique names for positive and negative offsets', () => {
      const testCases = [
        ['+05:00', '-05:00'],
        ['+08:00', '-08:00'],
        ['+00:00', '-00:00'],
        ['+12:00', '-12:00'],
      ]

      for (const [positive, negative] of testCases) {
        const positiveName = formatUtcOffset(positive)
        const negativeName = formatUtcOffset(negative)
        expect(positiveName).not.toEqual(negativeName)
      }
    })

    it('should produce unique names for different hour offsets', () => {
      const offsets = ['+05:00', '+06:00', '+07:00', '+08:00']
      const names = offsets.map(formatUtcOffset)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toEqual(offsets.length)
    })

    it('should produce unique names for different minute offsets', () => {
      const offsets = ['+05:00', '+05:15', '+05:30', '+05:45']
      const names = offsets.map(formatUtcOffset)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toEqual(offsets.length)
    })
  })
})
