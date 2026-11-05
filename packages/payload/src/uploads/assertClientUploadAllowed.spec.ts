import { describe, expect, it } from 'vitest'

import { assertClientUploadAllowed } from './assertClientUploadAllowed.js'

describe('assertClientUploadAllowed', () => {
  it.each([
    ['missing', undefined],
    ['whitespace', '   '],
  ])('should validate %s filename metadata', (_, filename) => {
    expect(() =>
      assertClientUploadAllowed({
        filename: filename as unknown as string,
        mimeType: 'image/png',
      }),
    ).toThrow('A valid filename is required for client uploads.')
  })

  it.each([
    ['missing', undefined],
    ['invalid', 'image'],
  ])('should validate %s MIME metadata', (_, mimeType) => {
    expect(() =>
      assertClientUploadAllowed({
        filename: 'image.png',
        mimeType: mimeType as unknown as string,
      }),
    ).toThrow('A valid MIME type is required for client uploads.')
  })

  it.each([
    ['filename extension', 'image.SVG', 'application/octet-stream'],
    ['declared MIME parameters', 'image.txt', 'image/svg+xml; charset=utf-8'],
    ['stylesheet MIME', 'reference.xsl', 'text/xsl'],
    ['stylesheet MIME parameters', 'reference.txt', 'TEXT/XSL; charset=utf-8'],
    ['stylesheet extension', 'reference.XSL', 'application/octet-stream'],
    ['transform extension', 'reference.XSLT', 'application/octet-stream'],
    ['sanitized stylesheet extension', 'reference.XSL.', 'application/octet-stream'],
    ['XML extension', 'image.xml', 'application/octet-stream'],
    ['XML structured-suffix MIME', 'image.txt', 'application/xhtml+xml; charset=utf-8'],
    ['sanitized trailing period', 'image.svg.', 'application/octet-stream'],
  ])('should require a server upload for content identified by %s', (_, filename, mimeType) => {
    expect(() => assertClientUploadAllowed({ filename, mimeType })).toThrow(
      'SVG and XML files must be uploaded through Payload.',
    )
  })

  it.each(['text/xsl', 'TEXT/XSL; charset=utf-8'])(
    'should preserve the configured client upload opt-out for %s',
    (mimeType) => {
      expect(() =>
        assertClientUploadAllowed({
          collection: { upload: { allowRestrictedFileTypes: true } },
          filename: 'reference.xsl',
          mimeType,
        }),
      ).not.toThrow()
    },
  )

  it.each(['reference.XSL', 'reference.XSLT'])(
    'should preserve the configured client upload opt-out for %s filenames',
    (filename) => {
      expect(() =>
        assertClientUploadAllowed({
          collection: { upload: { allowRestrictedFileTypes: true } },
          filename,
          mimeType: 'application/octet-stream',
        }),
      ).not.toThrow()
    },
  )

  it('should preserve configured client upload paths', () => {
    expect(() =>
      assertClientUploadAllowed({ filename: 'image.png', mimeType: 'image/png' }),
    ).not.toThrow()
    expect(() =>
      assertClientUploadAllowed({
        collection: { upload: { allowRestrictedFileTypes: true } },
        filename: 'image.svg',
        mimeType: 'image/svg+xml',
      }),
    ).not.toThrow()
    expect(() =>
      assertClientUploadAllowed({
        collection: { upload: { allowRestrictedFileTypes: true } },
        filename: 'image.png',
      }),
    ).not.toThrow()
  })
})
