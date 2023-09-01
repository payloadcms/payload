import type { ValidateOptions } from '../fields/config/types'

import { mimeTypeValidator } from './mimeTypeValidator'

const options = { siblingData: { filename: 'file.xyz' } } as ValidateOptions<
  undefined,
  undefined,
  undefined
>

describe('mimeTypeValidator', () => {
  it('should validate single mimeType', () => {
    const mimeTypes = ['image/png']
    const validate = mimeTypeValidator(mimeTypes)
    expect(validate('image/png', options)).toBe(true)
  })

  it('should validate multiple mimeTypes', () => {
    const mimeTypes = ['image/png', 'application/pdf']
    const validate = mimeTypeValidator(mimeTypes)
    expect(validate('image/png', options)).toBe(true)
    expect(validate('application/pdf', options)).toBe(true)
  })

  it('should validate using wildcard', () => {
    const mimeTypes = ['image/*']
    const validate = mimeTypeValidator(mimeTypes)
    expect(validate('image/png', options)).toBe(true)
    expect(validate('image/gif', options)).toBe(true)
  })

  it('should validate multiple wildcards', () => {
    const mimeTypes = ['image/*', 'audio/*']
    const validate = mimeTypeValidator(mimeTypes)
    expect(validate('image/png', options)).toBe(true)
    expect(validate('audio/mpeg', options)).toBe(true)
  })

  it('should not validate when unmatched', () => {
    const mimeTypes = ['image/png']
    const validate = mimeTypeValidator(mimeTypes)
    expect(validate('audio/mpeg', options)).toBe("Invalid file type: 'audio/mpeg'")
  })

  it('should not validate when unmatched - multiple mimeTypes', () => {
    const mimeTypes = ['image/png', 'application/pdf']
    const validate = mimeTypeValidator(mimeTypes)
    expect(validate('audio/mpeg', options)).toBe("Invalid file type: 'audio/mpeg'")
  })

  it('should not validate using wildcard - unmatched', () => {
    const mimeTypes = ['image/*']
    const validate = mimeTypeValidator(mimeTypes)
    expect(validate('audio/mpeg', options)).toBe("Invalid file type: 'audio/mpeg'")
  })

  it('should not validate multiple wildcards - unmatched', () => {
    const mimeTypes = ['image/*', 'audio/*']
    const validate = mimeTypeValidator(mimeTypes)
    expect(validate('video/mp4', options)).toBe("Invalid file type: 'video/mp4'")
    expect(validate('application/pdf', options)).toBe("Invalid file type: 'application/pdf'")
  })

  it('should not error when mimeType is missing', () => {
    const mimeTypes = ['image/*', 'application/pdf']
    const validate = mimeTypeValidator(mimeTypes)
    let value
    expect(validate(value, options)).toBe('Invalid file type')
  })
})
