/* eslint-disable jest/prefer-strict-equal */
import { formatName } from './formatName'

describe('formatName', () => {
  it.each`
    char   | expected
    ${'á'} | ${'a'}
    ${'è'} | ${'e'}
    ${'í'} | ${'i'}
    ${'ó'} | ${'o'}
    ${'ú'} | ${'u'}
    ${'ñ'} | ${'n'}
    ${'ü'} | ${'u'}
  `('should convert accented character: $char', ({ char, expected }) => {
    expect(formatName(char)).toEqual(expected)
  })
})
