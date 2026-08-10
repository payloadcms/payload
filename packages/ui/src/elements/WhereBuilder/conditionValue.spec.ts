import { describe, expect, it } from 'vitest'

import { isEmptyConditionValue, isNoOpConditionValueUpdate } from './conditionValue.js'

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

describe('isNoOpConditionValueUpdate', () => {
  it('skips the empty value a row reports back for a stored empty string', () => {
    // A row loaded from `?where[or][0][and][0][field][equals]=` holds `''`, but renders with
    // its value coerced to `undefined`, so on mount it reports `undefined` back up. Committing
    // that writes `{ equals: undefined }`, which `qs.stringify` omits — dropping the whole
    // condition from the URL and losing the row.
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
