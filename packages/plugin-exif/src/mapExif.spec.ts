import { describe, expect, it } from 'vitest'

import { mapExif } from './mapExif.js'

describe('mapExif', () => {
  it('should map camera make and model', () => {
    const result = mapExif({ Make: 'Canon', Model: 'EOS R5' })

    expect(result.cameraMake).toBe('Canon')
    expect(result.cameraModel).toBe('EOS R5')
  })

  it('should convert a DateTimeOriginal Date to an ISO string', () => {
    const date = new Date('2020-01-02T03:04:05.000Z')
    const result = mapExif({ DateTimeOriginal: date })

    expect(result.takenAt).toBe('2020-01-02T03:04:05.000Z')
  })

  it('should map gps latitude and longitude', () => {
    const result = mapExif({ latitude: 51.5, longitude: -0.12 })

    expect(result.latitude).toBe(51.5)
    expect(result.longitude).toBe(-0.12)
  })

  it('should default missing values to null and preserve the raw object', () => {
    const raw = { Foo: 'bar' }
    const result = mapExif(raw)

    expect(result.cameraMake).toBeNull()
    expect(result.takenAt).toBeNull()
    expect(result.latitude).toBeNull()
    expect(result.raw).toBe(raw)
  })
})
