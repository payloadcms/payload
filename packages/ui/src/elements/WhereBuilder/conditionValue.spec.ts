import { describe, expect, it } from 'vitest'

import {
  getDisplayedConditionValue,
  isEmptyConditionValue,
  isNoOpConditionValueUpdate,
} from './conditionValue.js'

describe('isEmptyConditionValue', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
  ])('treats %s as empty', (_label, value) => {
    expect(isEmptyConditionValue(value)).toBe(true)
  })

  it.each([
    ['a string', 'option1'],
    ['zero', 0],
    ['false', false],
  ])('treats %s as a real value', (_label, value) => {
    expect(isEmptyConditionValue(value)).toBe(false)
  })
})

describe('getDisplayedConditionValue', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
  ])('displays %s as no value', (_label, value) => {
    expect(getDisplayedConditionValue(value)).toBeUndefined()
  })

  it.each([
    ['zero', 0],
    ['false', false],
    ['an empty string', ''],
    ['a string', 'option1'],
  ])('displays %s as itself', (_label, value) => {
    expect(getDisplayedConditionValue(value)).toBe(value)
  })
})

describe('isNoOpConditionValueUpdate', () => {
  it('skips the empty value a row reports back for a stored empty string', () => {
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
    'skips a %s value stored as %s',
    (_incomingLabel, _storedLabel, incomingValue, storedValue) => {
      expect(isNoOpConditionValueUpdate({ incomingValue, storedValue, type: 'value' })).toBe(true)
    },
  )

  it('commits a value typed into an empty row', () => {
    expect(
      isNoOpConditionValueUpdate({ incomingValue: 'option1', storedValue: '', type: 'value' }),
    ).toBe(false)
  })

  it('commits a row the user cleared', () => {
    expect(
      isNoOpConditionValueUpdate({
        incomingValue: undefined,
        storedValue: 'option1',
        type: 'value',
      }),
    ).toBe(false)
  })

  it.each([['field'], ['operator']] as const)(
    'commits a %s edit on a row that holds no value',
    (type) => {
      expect(isNoOpConditionValueUpdate({ incomingValue: undefined, storedValue: '', type })).toBe(
        false,
      )
    },
  )
})
