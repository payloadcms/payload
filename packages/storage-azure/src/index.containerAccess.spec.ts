import type { Config } from 'payload'

import { describe, expect, it, vi } from 'vitest'

// Inspect the access level the adapter passes when it provisions a container.
const { createIfNotExists } = vi.hoisted(() => ({ createIfNotExists: vi.fn() }))

// Capture the closure index.ts hands to the adapter (normally run via onInit).
const captured = vi.hoisted(
  () => ({ createContainerIfNotExists: undefined }) as { createContainerIfNotExists?: () => void },
)

vi.mock('./utils/getStorageClient.js', () => ({
  getStorageClient: () => ({ createIfNotExists }),
}))

vi.mock('./adapter.js', () => ({
  createAzureAdapter: (args: { createContainerIfNotExists: () => void }) => {
    captured.createContainerIfNotExists = args.createContainerIfNotExists
    return () => ({ name: 'azure' })
  },
}))

vi.mock('@payloadcms/plugin-cloud-storage', () => ({
  cloudStoragePlugin: () => (config: Config) => config,
}))

const { azureStorage } = await import('./index.js')

const runContainerCreate = (
  containerAccess?: 'blob' | 'container' | 'private',
): { access?: string } | undefined => {
  createIfNotExists.mockClear()

  azureStorage({
    allowContainerCreate: true,
    baseURL: 'https://account.blob.core.windows.net',
    collections: { media: true },
    connectionString: 'UseDevelopmentStorage=true',
    containerAccess,
    containerName: 'media',
  })({ collections: [] } as unknown as Config)

  captured.createContainerIfNotExists?.()

  return createIfNotExists.mock.calls[0]?.[0] as { access?: string } | undefined
}

describe('azureStorage container creation', () => {
  it('should not create the container with anonymous public blob access by default', () => {
    const options = runContainerCreate()

    expect(createIfNotExists).toHaveBeenCalledTimes(1)
    // No access level == private. Any public value would bypass Payload's
    // access-controlled route, so the default must stay private.
    expect(options?.access).toBeUndefined()
  })

  it('should create a private container when containerAccess is private', () => {
    const options = runContainerCreate('private')

    expect(options?.access).toBeUndefined()
  })

  it('should apply public access only when explicitly opted in', () => {
    expect(runContainerCreate('blob')?.access).toBe('blob')
    expect(runContainerCreate('container')?.access).toBe('container')
  })

  it('should surface a creation failure as an awaitable rejection, not a swallowed promise', async () => {
    createIfNotExists.mockClear()
    createIfNotExists.mockRejectedValueOnce(
      new Error('AuthorizationFailure: public access is not permitted on this storage account'),
    )

    azureStorage({
      allowContainerCreate: true,
      baseURL: 'https://account.blob.core.windows.net',
      collections: { media: true },
      connectionString: 'UseDevelopmentStorage=true',
      containerName: 'media',
    })({ collections: [] } as unknown as Config)

    await expect(captured.createContainerIfNotExists?.()).rejects.toThrow('AuthorizationFailure')
  })
})
