import type { FormatDateArgs } from './formatDateTitle.js'

import { enUS } from 'date-fns/locale/en-US'
import { expect, test } from 'vitest'

import { formatDate, formatTimeToNow } from './formatDateTitle.js'

const i18n = { dateFNS: enUS } as FormatDateArgs['i18n']

test.each([undefined, '', 'invalid', new Date(NaN), NaN, Infinity])(
  'should omit an invalid date %s without crashing',
  (date) => {
    for (const timezone of [undefined, 'America/New_York']) {
      expect(formatDate({ date, i18n, pattern: 'yyyy-MM-dd HH:mm', timezone })).toBe('')
    }

    expect(formatTimeToNow({ date, i18n })).toBe('')
  },
)

test('should preserve date formatting in the configured time zone', () => {
  expect(
    formatDate({
      date: '2030-01-01T01:00:00Z',
      i18n,
      pattern: 'yyyy-MM-dd HH:mm',
      timezone: 'America/New_York',
    }),
  ).toBe('2029-12-31 20:00')
})

test('should format the Unix epoch as a valid date', () => {
  expect(formatDate({ date: 0, i18n, pattern: 'yyyy-MM-dd', timezone: 'UTC' })).toBe('1970-01-01')
  expect(formatTimeToNow({ date: 0, i18n })).not.toBe('')
})
