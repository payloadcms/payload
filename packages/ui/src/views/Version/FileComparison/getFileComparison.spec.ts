import { describe, expect, it } from 'vitest'

import { getFileComparison } from './getFileComparison.js'

const imageVersion = {
  filename: 'photo.png',
  filesize: 1200,
  height: 600,
  mimeType: 'image/png',
  thumbnailURL: '/api/media/file/photo-thumb.png?version=1',
  title: 'Photo',
  url: '/api/media/file/photo.png?version=1',
  width: 800,
}

const replacedImageVersion = {
  ...imageVersion,
  filename: 'photo-1.png',
  filesize: 2400,
  height: 1200,
  thumbnailURL: '/api/media/file/photo-1-thumb.png?version=2',
  url: '/api/media/file/photo-1.png?version=2',
  width: 1600,
}

describe('getFileComparison', () => {
  it('should return null when neither version has a file', () => {
    expect(
      getFileComparison({
        modifiedOnly: false,
        versionFromData: { title: 'a' },
        versionToData: { title: 'b' },
      }),
    ).toBeNull()
  })

  it('should read the file details from each version', () => {
    const comparison = getFileComparison({
      modifiedOnly: false,
      versionFromData: imageVersion,
      versionToData: replacedImageVersion,
    })

    expect(comparison?.fileFrom).toStrictEqual({
      filename: 'photo.png',
      filesize: 1200,
      height: 600,
      mimeType: 'image/png',
      previewSrc: '/api/media/file/photo.png?version=1',
      url: '/api/media/file/photo.png?version=1',
      width: 800,
    })
    expect(comparison?.fileTo?.filename).toBe('photo-1.png')
    expect(comparison?.fileTo?.url).toBe('/api/media/file/photo-1.png?version=2')
  })

  it('should use the thumbnail as the preview for files the browser cannot show', () => {
    const comparison = getFileComparison({
      modifiedOnly: false,
      versionFromData: undefined,
      versionToData: {
        filename: 'report.pdf',
        filesize: 300,
        mimeType: 'application/pdf',
        thumbnailURL: '/api/media/file/report-thumb.png?version=1',
        url: '/api/media/file/report.pdf?version=1',
      },
    })

    expect(comparison?.fileTo?.previewSrc).toBe('/api/media/file/report-thumb.png?version=1')
  })

  it('should mark the file as changed when the filename differs', () => {
    expect(
      getFileComparison({
        modifiedOnly: true,
        versionFromData: imageVersion,
        versionToData: replacedImageVersion,
      })?.hasChanged,
    ).toBe(true)
  })

  it('should mark the file as changed when the file size differs but the filename is the same', () => {
    expect(
      getFileComparison({
        modifiedOnly: true,
        versionFromData: imageVersion,
        versionToData: { ...imageVersion, filesize: 999 },
      })?.hasChanged,
    ).toBe(true)
  })

  it('should mark the file as changed when the earlier version has no file', () => {
    const comparison = getFileComparison({
      modifiedOnly: true,
      versionFromData: undefined,
      versionToData: imageVersion,
    })

    expect(comparison?.fileFrom).toBeNull()
    expect(comparison?.hasChanged).toBe(true)
  })

  it('should not mark the file as changed when only the version in the URL differs', () => {
    expect(
      getFileComparison({
        modifiedOnly: false,
        versionFromData: imageVersion,
        versionToData: {
          ...imageVersion,
          thumbnailURL: '/api/media/file/photo-thumb.png?version=2',
          title: 'New title',
          url: '/api/media/file/photo.png?version=2',
        },
      })?.hasChanged,
    ).toBe(false)
  })

  it('should mark the file as changed when only the stored object key differs', () => {
    expect(
      getFileComparison({
        modifiedOnly: true,
        versionFromData: { ...imageVersion, _objectKey: 'object-key-1' },
        versionToData: { ...imageVersion, _objectKey: 'object-key-2' },
      })?.hasChanged,
    ).toBe(true)
  })

  it('should not mark the file as changed when the stored object key is the same', () => {
    expect(
      getFileComparison({
        modifiedOnly: false,
        versionFromData: { ...imageVersion, _objectKey: 'object-key-1' },
        versionToData: {
          ...imageVersion,
          _objectKey: 'object-key-1',
          title: 'New title',
          url: '/api/media/file/photo.png?version=2',
        },
      })?.hasChanged,
    ).toBe(false)
  })

  it('should mark the file as changed when only the saved crop moved', () => {
    expect(
      getFileComparison({
        modifiedOnly: true,
        versionFromData: {
          ...imageVersion,
          _transforms: { crop: { height: 300, width: 300, x: 0, y: 0 } },
        },
        versionToData: {
          ...imageVersion,
          _transforms: { crop: { height: 300, width: 300, x: 100, y: 0 } },
        },
      })?.hasChanged,
    ).toBe(true)
  })

  it('should not mark the file as changed when the saved transforms are the same', () => {
    expect(
      getFileComparison({
        modifiedOnly: false,
        versionFromData: {
          ...imageVersion,
          _transforms: { crop: { height: 300, width: 300, x: 0, y: 0 } },
        },
        versionToData: {
          ...imageVersion,
          _transforms: { crop: { height: 300, width: 300, x: 0, y: 0 } },
          title: 'New title',
          url: '/api/media/file/photo.png?version=2',
        },
      })?.hasChanged,
    ).toBe(false)
  })

  it('should return null for an unchanged file when only modified fields are shown', () => {
    expect(
      getFileComparison({
        modifiedOnly: true,
        versionFromData: imageVersion,
        versionToData: { ...imageVersion, title: 'New title' },
      }),
    ).toBeNull()
  })
})
