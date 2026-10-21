import type { PayloadRequest } from '../../types/index.js'
import type { UploadInstructions } from '../types.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { checkFileMetadataRestrictions } from '../checkFileRestrictions.js'
import { generateStagedUploadInstructions } from '../stagedUpload.js'
import { getUploadInstructions } from './uploadInstructions.js'

const restrictionMocks = vi.hoisted(() => ({
  checkFileMetadataRestrictions: vi.fn(),
}))

vi.mock('../checkFileRestrictions.js', () => ({
  checkFileMetadataRestrictions: restrictionMocks.checkFileMetadataRestrictions,
  checkFileRestrictions: restrictionMocks.checkFileMetadataRestrictions,
}))

vi.mock('../stagedUpload.js', () => ({
  deleteStagedFile: vi.fn(),
  generateStagedUploadInstructions: vi.fn(),
  uploadStagedFile: vi.fn(),
}))

const adapterInstructions: UploadInstructions = {
  type: 'http',
  file: {
    filename: 'reference.bin',
    mimeType: 'application/octet-stream',
    size: 1,
    uploadReference: {},
  },
  request: { method: 'PUT', url: 'https://storage.invalid/reference.bin' },
}

const stagedInstructions: UploadInstructions = {
  type: 'http',
  file: {
    filename: 'reference.bin',
    mimeType: 'application/octet-stream',
    size: 1,
    uploadReference: { uploadId: 'reference' },
  },
  request: { method: 'PUT', url: '/api/upload-instructions/reference' },
}

const generateAdapterInstructions = vi.fn(async () => adapterInstructions)
const mockedCheckFileMetadataRestrictions = vi.mocked(checkFileMetadataRestrictions)
const mockedGenerateStagedUploadInstructions = vi.mocked(generateStagedUploadInstructions)

const createRequest = ({
  allowRestrictedFileTypes = false,
  withAdapterInstructions = true,
}: {
  allowRestrictedFileTypes?: boolean
  withAdapterInstructions?: boolean
} = {}) =>
  ({
    payload: {
      collections: {
        media: {
          config: {
            slug: 'media',
            access: { create: () => true },
            upload: {
              allowRestrictedFileTypes,
              ...(withAdapterInstructions && {
                uploadInstructions: { generate: generateAdapterInstructions },
              }),
            },
          },
        },
      },
      config: { upload: {} },
    },
  }) as unknown as PayloadRequest

describe('getUploadInstructions', () => {
  beforeEach(() => {
    generateAdapterInstructions.mockClear()
    mockedCheckFileMetadataRestrictions.mockReset()
    mockedGenerateStagedUploadInstructions.mockReset()
    mockedGenerateStagedUploadInstructions.mockResolvedValue(stagedInstructions)
  })

  it.each([
    ['reference.svg', 'application/octet-stream'],
    ['reference.bin', 'application/atom+xml'],
  ])('should keep %s with %s in document uploads', async (filename, mimeType) => {
    await expect(
      getUploadInstructions({
        collectionSlug: 'media',
        filename,
        filesize: 1,
        mimeType,
        overrideAccess: true,
        req: createRequest(),
      }),
    ).rejects.toMatchObject({ status: 400 })

    expect(mockedCheckFileMetadataRestrictions).toHaveBeenCalledOnce()
    expect(generateAdapterInstructions).not.toHaveBeenCalled()
  })

  it.each([
    ['ordinary uploads', false, 'reference.png', 'image/png'],
    ['explicitly allowed SVG uploads', true, 'reference.svg', 'image/svg+xml'],
  ])('should keep adapter instructions for %s', async (_, allowRestricted, filename, mimeType) => {
    await expect(
      getUploadInstructions({
        collectionSlug: 'media',
        filename,
        filesize: 1,
        mimeType,
        overrideAccess: true,
        req: createRequest({ allowRestrictedFileTypes: allowRestricted }),
      }),
    ).resolves.toBe(adapterInstructions)

    expect(generateAdapterInstructions).toHaveBeenCalledOnce()
  })

  it('should require a signed-in user for staged uploads', async () => {
    await expect(
      getUploadInstructions({
        collectionSlug: 'media',
        filename: 'reference.svg',
        filesize: 1,
        mimeType: 'image/svg+xml',
        req: createRequest({ withAdapterInstructions: false }),
      }),
    ).rejects.toMatchObject({ status: 403 })

    expect(mockedGenerateStagedUploadInstructions).not.toHaveBeenCalled()
  })
})
