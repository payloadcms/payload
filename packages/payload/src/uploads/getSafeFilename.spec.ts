import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSafeFileName, incrementName } from './getSafeFilename.js'

vi.mock('./docWithFilenameExists.js', () => ({
  docWithFilenameExists: vi.fn(),
}))

vi.mock('./fileExists.js', () => ({
  fileExists: vi.fn(),
}))

import { docWithFilenameExists } from './docWithFilenameExists.js'
import { fileExists } from './fileExists.js'

const mockDocWithFilenameExists = vi.mocked(docWithFilenameExists)
const mockFileExists = vi.mocked(fileExists)

describe('incrementName', () => {
  it('should add -1 suffix to filename without existing suffix', () => {
    expect(incrementName('photo.jpg')).toBe('photo-1.jpg')
  })

  it('should increment existing numeric suffix', () => {
    expect(incrementName('photo-1.jpg')).toBe('photo-2.jpg')
  })

  it('should handle multi-digit suffixes', () => {
    expect(incrementName('photo-99.jpg')).toBe('photo-100.jpg')
  })

  it('should handle filenames with multiple dots', () => {
    expect(incrementName('my.photo.name.jpg')).toBe('my.photo.name-1.jpg')
  })

  it('should handle filenames with hyphens but no numeric suffix', () => {
    expect(incrementName('my-photo.jpg')).toBe('my-photo-1.jpg')
  })

  it('should handle filenames with hyphens and numeric suffix', () => {
    expect(incrementName('my-photo-5.jpg')).toBe('my-photo-6.jpg')
  })

  it('should preserve the original extension', () => {
    expect(incrementName('document.pdf')).toBe('document-1.pdf')
    expect(incrementName('image.png')).toBe('image-1.png')
  })

  it('should handle files with long extensions', () => {
    expect(incrementName('archive.tar.gz')).toBe('archive.tar-1.gz')
  })

  it('should handle filename with no extension', () => {
    expect(incrementName('filename')).toBe('filename-1.filename')
  })

  it('should handle filename that is just an extension', () => {
    expect(incrementName('.gitignore')).toBe('.gitignore-1.gitignore')
  })

  it('should handle empty string', () => {
    expect(incrementName('')).toBe('-1.')
  })

  it('should handle filename ending with hyphen and non-numeric', () => {
    expect(incrementName('file-abc.jpg')).toBe('file-abc-1.jpg')
  })

  it('should handle filename with only numbers before extension', () => {
    expect(incrementName('12345.jpg')).toBe('12345-1.jpg')
  })

  it('should handle filename where base ends with -0', () => {
    expect(incrementName('file-0.jpg')).toBe('file-1.jpg')
  })

  it('should preserve jpeg extension', () => {
    expect(incrementName('photo.jpeg')).toBe('photo-1.jpeg')
    expect(incrementName('photo-1.jpeg')).toBe('photo-2.jpeg')
  })

  it('should preserve jpg extension', () => {
    expect(incrementName('photo.jpg')).toBe('photo-1.jpg')
    expect(incrementName('photo-1.jpg')).toBe('photo-2.jpg')
  })

  it('should preserve tiff extension', () => {
    expect(incrementName('image.tiff')).toBe('image-1.tiff')
    expect(incrementName('image-1.tiff')).toBe('image-2.tiff')
  })

  it('should preserve tif extension', () => {
    expect(incrementName('image.tif')).toBe('image-1.tif')
    expect(incrementName('image-1.tif')).toBe('image-2.tif')
  })

  it('should handle common image formats', () => {
    expect(incrementName('image.png')).toBe('image-1.png')
    expect(incrementName('image.gif')).toBe('image-1.gif')
    expect(incrementName('image.webp')).toBe('image-1.webp')
    expect(incrementName('image.avif')).toBe('image-1.avif')
    expect(incrementName('image.svg')).toBe('image-1.svg')
    expect(incrementName('image.bmp')).toBe('image-1.bmp')
    expect(incrementName('image.ico')).toBe('image-1.ico')
  })

  it('should handle common document formats', () => {
    expect(incrementName('document.pdf')).toBe('document-1.pdf')
    expect(incrementName('document.doc')).toBe('document-1.doc')
    expect(incrementName('document.docx')).toBe('document-1.docx')
    expect(incrementName('spreadsheet.xls')).toBe('spreadsheet-1.xls')
    expect(incrementName('spreadsheet.xlsx')).toBe('spreadsheet-1.xlsx')
    expect(incrementName('presentation.ppt')).toBe('presentation-1.ppt')
    expect(incrementName('presentation.pptx')).toBe('presentation-1.pptx')
  })

  it('should handle common video formats', () => {
    expect(incrementName('video.mp4')).toBe('video-1.mp4')
    expect(incrementName('video.mov')).toBe('video-1.mov')
    expect(incrementName('video.avi')).toBe('video-1.avi')
    expect(incrementName('video.webm')).toBe('video-1.webm')
    expect(incrementName('video.mkv')).toBe('video-1.mkv')
  })

  it('should handle common audio formats', () => {
    expect(incrementName('audio.mp3')).toBe('audio-1.mp3')
    expect(incrementName('audio.wav')).toBe('audio-1.wav')
    expect(incrementName('audio.ogg')).toBe('audio-1.ogg')
    expect(incrementName('audio.flac')).toBe('audio-1.flac')
    expect(incrementName('audio.aac')).toBe('audio-1.aac')
  })

  it('should handle uppercase extensions', () => {
    expect(incrementName('PHOTO.JPG')).toBe('PHOTO-1.JPG')
    expect(incrementName('PHOTO.JPEG')).toBe('PHOTO-1.JPEG')
    expect(incrementName('IMAGE.PNG')).toBe('IMAGE-1.PNG')
  })

  it('should handle mixed case extensions', () => {
    expect(incrementName('photo.Jpeg')).toBe('photo-1.Jpeg')
    expect(incrementName('image.Png')).toBe('image-1.Png')
  })
})

describe('getSafeFileName', () => {
  const mockReq = {} as Parameters<typeof getSafeFileName>[0]['req']

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return original filename when no conflicts exist', async () => {
    mockDocWithFilenameExists.mockResolvedValue(false)
    mockFileExists.mockResolvedValue(false)

    const result = await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'photo.jpg',
      req: mockReq,
      staticPath: '/uploads',
    })

    expect(result).toBe('photo.jpg')
    expect(mockDocWithFilenameExists).toHaveBeenCalledTimes(1)
    expect(mockFileExists).toHaveBeenCalledTimes(1)
  })

  it('should increment filename when document exists in database', async () => {
    mockDocWithFilenameExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    mockFileExists.mockResolvedValue(false)

    const result = await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'photo.jpg',
      req: mockReq,
      staticPath: '/uploads',
    })

    expect(result).toBe('photo-1.jpg')
  })

  it('should increment filename when file exists on filesystem', async () => {
    mockDocWithFilenameExists.mockResolvedValue(false)
    mockFileExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false)

    const result = await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'photo.jpg',
      req: mockReq,
      staticPath: '/uploads',
    })

    expect(result).toBe('photo-1.jpg')
  })

  it('should keep incrementing until unique name is found', async () => {
    mockDocWithFilenameExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
    mockFileExists.mockResolvedValue(false)

    const result = await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'photo.jpg',
      req: mockReq,
      staticPath: '/uploads',
    })

    expect(result).toBe('photo-3.jpg')
  })

  it('should handle conflicts from both database and filesystem', async () => {
    mockDocWithFilenameExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
    mockFileExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false)

    const result = await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'photo.jpg',
      req: mockReq,
      staticPath: '/uploads',
    })

    expect(result).toBe('photo-2.jpg')
  })

  it('should pass prefix to docWithFilenameExists', async () => {
    mockDocWithFilenameExists.mockResolvedValue(false)
    mockFileExists.mockResolvedValue(false)

    await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'photo.jpg',
      prefix: 'images/',
      req: mockReq,
      staticPath: '/uploads',
    })

    expect(mockDocWithFilenameExists).toHaveBeenCalledWith({
      collectionSlug: 'media',
      filename: 'photo.jpg',
      path: '/uploads',
      prefix: 'images/',
      req: mockReq,
    })
  })

  it('should check correct filesystem path', async () => {
    mockDocWithFilenameExists.mockResolvedValue(false)
    mockFileExists.mockResolvedValue(false)

    await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'photo.jpg',
      req: mockReq,
      staticPath: '/var/uploads/media',
    })

    expect(mockFileExists).toHaveBeenCalledWith('/var/uploads/media/photo.jpg')
  })

  it('should handle filename that already has numeric suffix', async () => {
    mockDocWithFilenameExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    mockFileExists.mockResolvedValue(false)

    const result = await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'photo-5.jpg',
      req: mockReq,
      staticPath: '/uploads',
    })

    expect(result).toBe('photo-6.jpg')
  })

  it('should preserve jpeg extension when incrementing', async () => {
    mockDocWithFilenameExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    mockFileExists.mockResolvedValue(false)

    const result = await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'photo.jpeg',
      req: mockReq,
      staticPath: '/uploads',
    })

    expect(result).toBe('photo-1.jpeg')
  })

  it('should preserve tiff extension when incrementing', async () => {
    mockDocWithFilenameExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    mockFileExists.mockResolvedValue(false)

    const result = await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'image.tiff',
      req: mockReq,
      staticPath: '/uploads',
    })

    expect(result).toBe('image-1.tiff')
  })

  it('should handle webp files', async () => {
    mockDocWithFilenameExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    mockFileExists.mockResolvedValue(false)

    const result = await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'image.webp',
      req: mockReq,
      staticPath: '/uploads',
    })

    expect(result).toBe('image-1.webp')
  })

  it('should handle pdf files', async () => {
    mockDocWithFilenameExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    mockFileExists.mockResolvedValue(false)

    const result = await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'document.pdf',
      req: mockReq,
      staticPath: '/uploads',
    })

    expect(result).toBe('document-1.pdf')
  })

  it('should handle mp4 video files', async () => {
    mockDocWithFilenameExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    mockFileExists.mockResolvedValue(false)

    const result = await getSafeFileName({
      collectionSlug: 'media',
      desiredFilename: 'video.mp4',
      req: mockReq,
      staticPath: '/uploads',
    })

    expect(result).toBe('video-1.mp4')
  })
})
