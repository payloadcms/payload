import { describe, expect, it } from 'vitest'

import { resolveTempFileHandling } from './generateFileData.js'

describe('resolveTempFileHandling', () => {
  it.each([
    {
      disableLocalStorage: true,
      expected: { type: 'useBuffer' },
      hasProcessedBuffer: true,
      tempFilePath: '/tmp/file',
    },
    {
      disableLocalStorage: false,
      expected: { type: 'useBuffer' },
      hasProcessedBuffer: true,
      tempFilePath: '/tmp/file',
    },
    {
      disableLocalStorage: true,
      expected: { type: 'useBuffer' },
      hasProcessedBuffer: true,
      tempFilePath: undefined,
    },
    {
      disableLocalStorage: false,
      expected: { type: 'useBuffer' },
      hasProcessedBuffer: true,
      tempFilePath: undefined,
    },
    {
      disableLocalStorage: true,
      expected: { type: 'skip' },
      hasProcessedBuffer: false,
      tempFilePath: '/tmp/file',
    },
    {
      disableLocalStorage: false,
      expected: { sourcePath: '/tmp/file', type: 'copyFromTempFile' },
      hasProcessedBuffer: false,
      tempFilePath: '/tmp/file',
    },
    {
      disableLocalStorage: true,
      expected: { type: 'useBuffer' },
      hasProcessedBuffer: false,
      tempFilePath: undefined,
    },
    {
      disableLocalStorage: false,
      expected: { type: 'useBuffer' },
      hasProcessedBuffer: false,
      tempFilePath: undefined,
    },
  ])(
    'hasProcessedBuffer=$hasProcessedBuffer, tempFilePath=$tempFilePath, disableLocalStorage=$disableLocalStorage -> $expected.type',
    ({ disableLocalStorage, expected, hasProcessedBuffer, tempFilePath }) => {
      expect(
        resolveTempFileHandling({ disableLocalStorage, hasProcessedBuffer, tempFilePath }),
      ).toEqual(expected)
    },
  )
})
