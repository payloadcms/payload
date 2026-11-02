import { describe, expect, it } from 'vitest'

import { getSanitizedUploadFilename, isXmlMimeType } from './getFileTypeIdentity.js'

describe('getSanitizedUploadFilename', () => {
  it('should use the output extension while preserving the sanitized source basename', () => {
    expect(getSanitizedUploadFilename('incoming/image.jpg', 'png')).toBe('image.png')
  })
})

describe('isXmlMimeType', () => {
  it.each([
    ['application/xml', true],
    ['text/xml', true],
    ['application/atom+xml', true],
    ['image/svg+xml', true],
    ['APPLICATION/XML', true],
    [' Application/Atom+Xml; Charset=UTF-8 ', true],
    ['text/plain', false],
  ])('should classify %s as %s', (mimeType, expected) => {
    expect(isXmlMimeType(mimeType)).toBe(expected)
  })
})
