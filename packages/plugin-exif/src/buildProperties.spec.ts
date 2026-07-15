import { describe, expect, it } from 'vitest'

import { buildProperties } from './buildProperties.js'

describe('buildProperties', () => {
  it('should format the full design case in the correct order', () => {
    const result = buildProperties({
      exif: {
        location: [-122.4194, 37.7749],
        raw: {
          ColorSpace: 1,
          ExposureMode: 1,
          ExposureTime: 0.002,
          FNumber: 2.8,
          FocalLength: 35,
          ISO: 400,
          LensModel: 'RF 24-70mm f/2.8L IS USM',
          Make: 'Canon',
          Model: 'EOS R5',
          Software: 'Adobe Lightroom 7.0',
          WhiteBalance: 0,
          Flash: 0,
        },
        takenAt: '2026-06-08T14:32:07.000Z',
      },
      file: {
        filesize: 25902899,
        height: 5464,
        mimeType: 'image/jpeg',
        width: 8192,
      },
    })

    expect(result).toEqual([
      { label: 'Camera Make', value: 'Canon' },
      { label: 'Camera Model', value: 'EOS R5' },
      { label: 'Lens', value: 'RF 24-70mm f/2.8L IS USM' },
      { label: 'Aperture', value: 'f/2.8' },
      { label: 'Shutter Speed', value: '1/500s' },
      { label: 'ISO', value: '400' },
      { label: 'Focal Length', value: '35mm' },
      { label: 'Exposure Mode', value: 'Manual' },
      { label: 'White Balance', value: 'Auto' },
      { label: 'Flash', value: 'Off' },
      { label: 'Date/Time', value: '2026-06-08 14:32:07' },
      { label: 'GPS Latitude', value: '37.7749° N' },
      { label: 'GPS Longitude', value: '122.4194° W' },
      { label: 'Image Width', value: '8192 px' },
      { label: 'Image Height', value: '5464 px' },
      { label: 'File Size', value: '24.7 MB' },
      { label: 'Color Space', value: 'sRGB' },
      { label: 'Software', value: 'Adobe Lightroom 7.0' },
    ])
  })

  it('should return an empty array for empty input', () => {
    expect(buildProperties({})).toEqual([])
    expect(buildProperties({ exif: null, file: null })).toEqual([])
  })

  it('should hide empty rows and return only present values', () => {
    const result = buildProperties({ exif: { raw: { Make: 'Canon' } } })

    expect(result).toEqual([{ label: 'Camera Make', value: 'Canon' }])
  })

  it('should treat empty-string sources as absent', () => {
    const result = buildProperties({ exif: { raw: { Make: '', Model: 'EOS R5' } } })

    expect(result).toEqual([{ label: 'Camera Model', value: 'EOS R5' }])
  })

  it('should resolve Lens from LensModel first then Lens', () => {
    expect(buildProperties({ exif: { raw: { Lens: 'fallback', LensModel: 'primary' } } })).toEqual([
      { label: 'Lens', value: 'primary' },
    ])
    expect(buildProperties({ exif: { raw: { Lens: 'fallback' } } })).toEqual([
      { label: 'Lens', value: 'fallback' },
    ])
  })

  it('should format shutter speeds >= 1 second in seconds', () => {
    expect(buildProperties({ exif: { raw: { ExposureTime: 2 } } })).toEqual([
      { label: 'Shutter Speed', value: '2s' },
    ])
  })

  it('should format southern and western hemisphere GPS with correct signs', () => {
    const result = buildProperties({ exif: { location: [-70.5, -33.8] } })

    expect(result).toEqual([
      { label: 'GPS Latitude', value: '33.8000° S' },
      { label: 'GPS Longitude', value: '70.5000° W' },
    ])
  })

  it('should include GPS coordinates of exactly zero', () => {
    const result = buildProperties({ exif: { location: [0, 0] } })

    expect(result).toEqual([
      { label: 'GPS Latitude', value: '0.0000° N' },
      { label: 'GPS Longitude', value: '0.0000° E' },
    ])
  })

  it('should skip GPS rows when location is not a two-number array', () => {
    expect(buildProperties({ exif: { location: null } })).toEqual([])
    // @ts-expect-error testing defensive handling of bad input
    expect(buildProperties({ exif: { location: [1] } })).toEqual([])
    // @ts-expect-error testing defensive handling of bad input
    expect(buildProperties({ exif: { location: ['a', 'b'] } })).toEqual([])
  })

  it('should humanize file sizes for MB, KB, and bytes', () => {
    expect(buildProperties({ file: { filesize: 25902899 } })).toEqual([
      { label: 'File Size', value: '24.7 MB' },
    ])
    expect(buildProperties({ file: { filesize: 2048 } })).toEqual([
      { label: 'File Size', value: '2.0 KB' },
    ])
    expect(buildProperties({ file: { filesize: 500 } })).toEqual([
      { label: 'File Size', value: '500 B' },
    ])
  })

  it('should format Flash as On for odd numbers and Off for even', () => {
    expect(buildProperties({ exif: { raw: { Flash: 1 } } })).toEqual([
      { label: 'Flash', value: 'On' },
    ])
    expect(buildProperties({ exif: { raw: { Flash: 25 } } })).toEqual([
      { label: 'Flash', value: 'On' },
    ])
    expect(buildProperties({ exif: { raw: { Flash: 0 } } })).toEqual([
      { label: 'Flash', value: 'Off' },
    ])
  })

  it('should format Flash from booleans', () => {
    expect(buildProperties({ exif: { raw: { Flash: true } } })).toEqual([
      { label: 'Flash', value: 'On' },
    ])
    expect(buildProperties({ exif: { raw: { Flash: false } } })).toEqual([
      { label: 'Flash', value: 'Off' },
    ])
  })

  it('should pass through Exposure Mode and White Balance strings', () => {
    const result = buildProperties({
      exif: { raw: { ExposureMode: 'Custom mode', WhiteBalance: 'Cloudy' } },
    })

    expect(result).toEqual([
      { label: 'Exposure Mode', value: 'Custom mode' },
      { label: 'White Balance', value: 'Cloudy' },
    ])
  })

  it('should map enum numbers and fall back to String for unknown values', () => {
    expect(buildProperties({ exif: { raw: { ExposureMode: 2 } } })).toEqual([
      { label: 'Exposure Mode', value: 'Auto bracket' },
    ])
    expect(buildProperties({ exif: { raw: { ExposureMode: 9 } } })).toEqual([
      { label: 'Exposure Mode', value: '9' },
    ])
    expect(buildProperties({ exif: { raw: { WhiteBalance: 1 } } })).toEqual([
      { label: 'White Balance', value: 'Manual' },
    ])
    expect(buildProperties({ exif: { raw: { ColorSpace: 65535 } } })).toEqual([
      { label: 'Color Space', value: 'Uncalibrated' },
    ])
    expect(buildProperties({ exif: { raw: { ColorSpace: 2 } } })).toEqual([
      { label: 'Color Space', value: 'Adobe RGB' },
    ])
    expect(buildProperties({ exif: { raw: { ColorSpace: 7 } } })).toEqual([
      { label: 'Color Space', value: '7' },
    ])
  })

  it('should fall back to raw dimensions when file dimensions are absent', () => {
    const result = buildProperties({
      exif: { raw: { ExifImageHeight: 3000, ExifImageWidth: 4000 } },
    })

    expect(result).toEqual([
      { label: 'Image Width', value: '4000 px' },
      { label: 'Image Height', value: '3000 px' },
    ])
  })

  it('should fall back to raw ImageWidth/ImageHeight when ExifImage dimensions absent', () => {
    const result = buildProperties({
      exif: { raw: { ImageHeight: 300, ImageWidth: 400 } },
    })

    expect(result).toEqual([
      { label: 'Image Width', value: '400 px' },
      { label: 'Image Height', value: '300 px' },
    ])
  })

  it('should prefer file dimensions over raw dimensions', () => {
    const result = buildProperties({
      exif: { raw: { ExifImageWidth: 4000 } },
      file: { width: 8192 },
    })

    expect(result).toEqual([{ label: 'Image Width', value: '8192 px' }])
  })

  it('should pass through a non-ISO Date/Time string as-is', () => {
    const result = buildProperties({ exif: { takenAt: '2026:06:08 14:32:07' } })

    expect(result).toEqual([{ label: 'Date/Time', value: '2026:06:08 14:32:07' }])
  })

  it('should keep remaining rows in relative order when a middle row is missing', () => {
    const result = buildProperties({
      exif: { raw: { FNumber: 2.8, ISO: 400, Make: 'Canon' } },
    })

    expect(result).toEqual([
      { label: 'Camera Make', value: 'Canon' },
      { label: 'Aperture', value: 'f/2.8' },
      { label: 'ISO', value: '400' },
    ])
  })

  it('should skip numeric rows whose value is not a finite number', () => {
    // @ts-expect-error testing defensive handling of bad input
    expect(buildProperties({ exif: { raw: { FNumber: 'nope', ISO: NaN } } })).toEqual([])
  })

  it('should keep ISO of zero as a present value', () => {
    expect(buildProperties({ exif: { raw: { ISO: 0 } } })).toEqual([{ label: 'ISO', value: '0' }])
  })
})
