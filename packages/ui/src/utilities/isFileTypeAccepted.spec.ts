import { describe, expect, it } from 'vitest'

import { isFileTypeAccepted } from './isFileTypeAccepted.js'

const createFile = ({ type }: { type: string }) => new File(['content'], 'file', { type })

describe('isFileTypeAccepted', () => {
  it('should accept any file when the collection sets no MIME types', () => {
    expect(
      isFileTypeAccepted({ file: createFile({ type: 'image/png' }), mimeTypes: undefined }),
    ).toBe(true)
  })

  it('should accept any file when the MIME type list is empty', () => {
    expect(isFileTypeAccepted({ file: createFile({ type: 'image/png' }), mimeTypes: [] })).toBe(
      true,
    )
  })

  it('should accept a file that matches a wildcard MIME type', () => {
    expect(
      isFileTypeAccepted({ file: createFile({ type: 'image/png' }), mimeTypes: ['image/*'] }),
    ).toBe(true)
  })

  it('should reject a file that matches no MIME type', () => {
    expect(
      isFileTypeAccepted({
        file: createFile({ type: 'image/png' }),
        mimeTypes: ['application/pdf'],
      }),
    ).toBe(false)
  })
})
