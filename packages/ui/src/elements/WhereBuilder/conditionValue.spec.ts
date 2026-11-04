import { describe, expect, it } from 'vitest'

import {
  getDateFilterPickerValue,
  getDateFilterOperatorValue,
  getDateFilterValue,
  getDisplayedConditionValue,
  isEmptyConditionValue,
  isNoOpConditionValueUpdate,
  shouldSyncConditionValue,
} from './conditionValue.js'

describe('date filter values', () => {
  it('should resync a date value when its operator changes externally', () => {
    expect(
      shouldSyncConditionValue({
        fieldPath: 'publishedOn',
        lastFieldPath: 'publishedOn',
        lastOperator: 'equals',
        lastReportedValue: '2026-06-15',
        operator: 'in',
        value: '2026-06-15',
      }),
    ).toBe(true)
  })

  it('should preserve a selected calendar day instead of the picker instant', () => {
    expect(
      getDateFilterValue({
        date: new Date('2026-06-15T12:00:00.000Z'),
        operator: 'equals',
        pickerAppearance: 'default',
      }),
    ).toBe('2026-06-15')
  })

  it('should preserve exact timestamps for date-and-time fields', () => {
    const date = new Date('2026-06-15T12:34:56.000Z')

    expect(getDateFilterValue({ date, operator: 'equals', pickerAppearance: 'dayAndTime' })).toBe(
      date,
    )
  })

  it('should preserve exact timestamps for unsupported date-only operators', () => {
    const date = new Date('2026-06-15T12:00:00.000Z')

    expect(getDateFilterValue({ date, operator: 'in', pickerAppearance: 'default' })).toBe(date)
  })

  it('should clear a calendar day when switching to an incompatible exact-value operator', () => {
    expect(
      getDateFilterOperatorValue({
        operator: 'in',
        value: '2026-06-15',
      }),
    ).toBeUndefined()
  })

  it('should preserve exact Date values when switching comparison operators', () => {
    const exactDate = new Date('2026-06-15T12:00:00.000Z')

    expect(getDateFilterOperatorValue({ operator: 'greater_than', value: exactDate })).toBe(
      exactDate,
    )
  })

  it('should preserve values when the operator keeps the same date meaning', () => {
    const exactDate = new Date('2026-06-15T12:34:56.000Z')

    expect(getDateFilterOperatorValue({ operator: 'greater_than', value: '2026-06-15' })).toBe(
      '2026-06-15',
    )
    expect(getDateFilterOperatorValue({ operator: 'in', value: exactDate })).toBe(exactDate)
    expect(
      getDateFilterOperatorValue({
        operator: 'equals',
        value: '2026-06-15T12:34:56.000Z',
      }),
    ).toBe('2026-06-15T12:34:56.000Z')
  })

  it('should not reinterpret an exact noon-UTC timestamp as a calendar day', () => {
    expect(
      getDateFilterOperatorValue({
        operator: 'equals',
        value: '2026-06-15T12:00:00.000Z',
      }),
    ).toBe('2026-06-15T12:00:00.000Z')
  })

  it('should clear an invalid date value when selecting a date comparison operator', () => {
    expect(
      getDateFilterOperatorValue({
        operator: 'greater_than',
        value: '2026-02-30',
      }),
    ).toBeUndefined()
  })

  it('should clear a non-date value when selecting a date-and-time comparison operator', () => {
    expect(
      getDateFilterOperatorValue({
        operator: 'greater_than',
        pickerAppearance: 'dayAndTime',
        value: 'true',
      }),
    ).toBeUndefined()
  })

  it('should display a calendar date on the selected browser calendar day', () => {
    const value = getDateFilterPickerValue({
      pickerAppearance: 'default',
      value: '2026-06-15',
    })

    expect(value).toBeInstanceOf(Date)
    expect((value as Date).getFullYear()).toBe(2026)
    expect((value as Date).getMonth()).toBe(5)
    expect((value as Date).getDate()).toBe(15)
  })

  it('should display an early calendar date without remapping its year', () => {
    const value = getDateFilterPickerValue({
      pickerAppearance: 'default',
      value: '0099-12-31',
    })

    expect(value).toBeInstanceOf(Date)
    expect((value as Date).getFullYear()).toBe(99)
    expect((value as Date).getMonth()).toBe(11)
    expect((value as Date).getDate()).toBe(31)
  })

  it('should not reinterpret a bare date for date-and-time fields', () => {
    expect(
      getDateFilterPickerValue({
        pickerAppearance: 'dayAndTime',
        value: '2026-06-15',
      }),
    ).toBe('2026-06-15')
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
