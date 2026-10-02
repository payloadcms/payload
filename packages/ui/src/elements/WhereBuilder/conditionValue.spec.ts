import { describe, expect, it } from 'vitest'

import {
  getDateFilterValue,
  getDisplayedConditionValue,
  isEmptyConditionValue,
  isNoOpConditionValueUpdate,
} from './conditionValue.js'

describe('getDateFilterValue', () => {
  it.each([
    ['greater_than_equal', '2026-03-29T00:00:00.000Z'],
    ['less_than', '2026-03-29T00:00:00.000Z'],
    ['greater_than', '2026-03-29T22:59:59.999Z'],
    ['less_than_equal', '2026-03-29T22:59:59.999Z'],
  ] as const)('should use the configured day boundary for %s', (operator, expected) => {
    const result = getDateFilterValue({
      date: new Date('2026-03-29T12:00:00.000Z'),
      operator,
      timezone: 'Europe/London',
    })

    expect(result).toEqual(new Date(expected))
  })

  it('should use UTC boundaries for date-only fields without a configured timezone', () => {
    const result = getDateFilterValue({
      date: new Date('2026-06-15T12:00:00.000Z'),
      operator: 'greater_than_equal',
      timezone: 'UTC',
    })

    expect(result).toEqual(new Date('2026-06-15T00:00:00.000Z'))
  })
})

describe('isEmptyConditionValue', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
  ])('should treat %s as empty', (_label, value) => {
    expect(isEmptyConditionValue({ value })).toBe(true)
  })

  it.each([
    ['a string', 'option1'],
    ['zero', 0],
    ['false', false],
  ])('should treat %s as a real value', (_label, value) => {
    expect(isEmptyConditionValue({ value })).toBe(false)
  })
})

describe('getDisplayedConditionValue', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
  ])('should display %s as no value', (_label, value) => {
    expect(getDisplayedConditionValue({ value })).toBeUndefined()
  })

  it.each([
    ['zero', 0],
    ['false', false],
    ['an empty string', ''],
    ['a string', 'option1'],
  ])('should display %s as itself', (_label, value) => {
    expect(getDisplayedConditionValue({ value })).toBe(value)
  })
})

describe('isNoOpConditionValueUpdate', () => {
  it('should skip the empty value a row reports back for a stored empty string', () => {
    // The row this covers comes from a URL such as `?where[or][0][and][0][field][equals]=`.
    expect(
      isNoOpConditionValueUpdate({ incomingValue: undefined, storedValue: '', type: 'value' }),
    ).toBe(true)
  })

  it.each([
    ['undefined', 'an empty string', undefined, ''],
    ['null', 'undefined', null, undefined],
    ['undefined', 'undefined', undefined, undefined],
  ])(
    'should skip a %s value stored as %s',
    (_incomingLabel, _storedLabel, incomingValue, storedValue) => {
      expect(isNoOpConditionValueUpdate({ incomingValue, storedValue, type: 'value' })).toBe(true)
    },
  )

  it('should commit a value typed into an empty row', () => {
    expect(
      isNoOpConditionValueUpdate({ incomingValue: 'option1', storedValue: '', type: 'value' }),
    ).toBe(false)
  })

  it('should commit a row the user cleared', () => {
    expect(
      isNoOpConditionValueUpdate({
        incomingValue: undefined,
        storedValue: 'option1',
        type: 'value',
      }),
    ).toBe(false)
  })

  it.each([['field'], ['operator']] as const)(
    'should commit a %s edit on a row that holds no value',
    (type) => {
      expect(isNoOpConditionValueUpdate({ incomingValue: undefined, storedValue: '', type })).toBe(
        false,
      )
    },
  )
})
