import { describe, expect, it } from 'vitest'

import { shouldResetValueOnOperatorChange } from './validOperators.js'

describe('shouldResetValueOnOperatorChange', () => {
  it('should reset a value carried over from exists when switching to equals', () => {
    // The `exists` value is the string 'true'/'false', which passes as a valid value for
    // the 'any'-typed `equals` operator — but on e.g. a relationship field the server
    // casts it to NaN and the query crashes.
    expect(
      shouldResetValueOnOperatorChange({
        fieldType: 'relationship',
        newOperator: 'equals',
        previousOperator: 'exists',
        value: 'true',
      }),
    ).toBe(true)
  })

  it('should reset a value carried over from exists when switching to not_equals', () => {
    expect(
      shouldResetValueOnOperatorChange({
        fieldType: 'relationship',
        newOperator: 'not_equals',
        previousOperator: 'exists',
        value: 'false',
      }),
    ).toBe(true)
  })

  it('should keep the value when staying on exists', () => {
    expect(
      shouldResetValueOnOperatorChange({
        fieldType: 'relationship',
        newOperator: 'exists',
        previousOperator: 'exists',
        value: 'true',
      }),
    ).toBe(false)
  })

  it('should keep the value when switching between equals and not_equals', () => {
    expect(
      shouldResetValueOnOperatorChange({
        fieldType: 'text',
        newOperator: 'not_equals',
        previousOperator: 'equals',
        value: 'some text',
      }),
    ).toBe(false)
  })

  it('should reset the value when the new operator cannot take it', () => {
    expect(
      shouldResetValueOnOperatorChange({
        fieldType: 'number',
        newOperator: 'contains',
        previousOperator: 'equals',
        value: 42,
      }),
    ).toBe(true)
  })

  it('should keep a boolean-like string value when switching to exists', () => {
    expect(
      shouldResetValueOnOperatorChange({
        fieldType: 'text',
        newOperator: 'exists',
        previousOperator: 'equals',
        value: 'true',
      }),
    ).toBe(false)
  })

  it('should keep the value when switching between equals and in', () => {
    expect(
      shouldResetValueOnOperatorChange({
        fieldType: 'relationship',
        newOperator: 'in',
        previousOperator: 'equals',
        value: ['1', '2'],
      }),
    ).toBe(false)
  })
})
