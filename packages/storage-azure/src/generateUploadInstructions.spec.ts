import type { TokenCredential } from '@azure/core-auth'
import type { BlobServiceClient, UserDelegationKey } from '@azure/storage-blob'
import type { PayloadRequest, UploadInstructions } from 'payload'

import {
  AnonymousCredential,
  ContainerClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/plugin-cloud-storage/utilities', () => ({
  resolveSignedURLKey: vi.fn(({ docPrefix, filename }: { docPrefix?: string; filename: string }) =>
    Promise.resolve({
      fileKey: docPrefix ? `${docPrefix}/${filename}` : filename,
      sanitizedDocPrefix: docPrefix ?? '',
      sanitizedFilename: filename,
    }),
  ),
}))

import { generateUploadInstructions } from './generateUploadInstructions.js'

const accountName = 'myaccount'
const containerName = 'mycontainer'
const containerURL = `https://${accountName}.blob.core.windows.net/${containerName}`

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  Buffer.from('account-key').toString('base64'),
)

const tokenCredential: TokenCredential = {
  getToken: () =>
    Promise.resolve({ expiresOnTimestamp: Date.now() + 60 * 60 * 1000, token: 'fake-token' }),
}

const createUserDelegationKey = (): UserDelegationKey => ({
  signedExpiresOn: new Date(Date.now() + 6 * 60 * 60 * 1000),
  signedObjectId: 'object-id',
  signedService: 'b',
  signedStartsOn: new Date(),
  signedTenantId: 'tenant-id',
  signedVersion: '2020-02-10',
  value: Buffer.from('user-delegation-key').toString('base64'),
})

const createServiceClientMock = () => {
  const getUserDelegationKey = vi.fn(() => Promise.resolve(createUserDelegationKey()))

  return {
    getUserDelegationKey,
    serviceClient: { getUserDelegationKey } as unknown as BlobServiceClient,
  }
}

const req = { t: (key: string) => key, user: { id: 1 } } as unknown as PayloadRequest

const generateArgs = {
  collectionSlug: 'media',
  filename: 'file.png',
  filesize: 3,
  mimeType: 'image/png',
  req,
}

const getSignedUploadURL = (instructions: UploadInstructions): URL => {
  expect(instructions.type).toBe('dispatch')

  const { data } = instructions as Extract<UploadInstructions, { type: 'dispatch' }>

  return new URL((data as { url: string }).url)
}

const createGenerate = ({
  credential,
  serviceClient,
}: {
  credential: AnonymousCredential | StorageSharedKeyCredential | TokenCredential
  serviceClient: BlobServiceClient
}) =>
  generateUploadInstructions({
    collectionPrefix: '',
    containerName,
    getBlobServiceClient: () => serviceClient,
    getStorageClient: () => new ContainerClient(containerURL, credential),
  })

describe('generateUploadInstructions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should sign a service SAS with a shared key credential', async () => {
    const { getUserDelegationKey, serviceClient } = createServiceClientMock()
    const generate = createGenerate({ credential: sharedKeyCredential, serviceClient })

    const instructions = await generate(generateArgs)

    const url = getSignedUploadURL(instructions)

    expect(url.href).toContain(`${containerURL}/file.png?`)
    expect(url.searchParams.get('sig')).toBeTruthy()
    expect(url.searchParams.get('sp')).toBe('w')
    // No user delegation SAS markers and no key requested
    expect(url.searchParams.get('skoid')).toBeNull()
    expect(getUserDelegationKey).not.toHaveBeenCalled()
  })

  it('should sign a user delegation SAS with a token credential', async () => {
    const { getUserDelegationKey, serviceClient } = createServiceClientMock()
    const generate = createGenerate({ credential: tokenCredential, serviceClient })

    const instructions = await generate(generateArgs)

    const url = getSignedUploadURL(instructions)

    expect(url.href).toContain(`${containerURL}/file.png?`)
    expect(url.searchParams.get('sig')).toBeTruthy()
    expect(url.searchParams.get('sp')).toBe('w')
    // User delegation SAS markers
    expect(url.searchParams.get('skoid')).toBe('object-id')
    expect(url.searchParams.get('sktid')).toBe('tenant-id')
    expect(getUserDelegationKey).toHaveBeenCalledTimes(1)
  })

  it('should reuse the cached user delegation key across requests', async () => {
    const { getUserDelegationKey, serviceClient } = createServiceClientMock()
    const generate = createGenerate({ credential: tokenCredential, serviceClient })

    await generate(generateArgs)
    await generate(generateArgs)

    expect(getUserDelegationKey).toHaveBeenCalledTimes(1)
  })

  it('should throw for credentials that cannot sign SAS tokens', async () => {
    const { serviceClient } = createServiceClientMock()
    const generate = createGenerate({ credential: new AnonymousCredential(), serviceClient })

    await expect(generate(generateArgs)).rejects.toThrow(/cannot sign upload URLs/)
  })

  it('should throw Forbidden when there is no user and no access override', async () => {
    const { serviceClient } = createServiceClientMock()
    const generate = createGenerate({ credential: sharedKeyCredential, serviceClient })

    await expect(
      generate({ ...generateArgs, req: { ...req, user: null } as unknown as PayloadRequest }),
    ).rejects.toThrow()
  })
})
