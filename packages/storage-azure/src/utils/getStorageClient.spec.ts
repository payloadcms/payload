import type { TokenCredential } from '@azure/core-auth'

import { describe, expect, it } from 'vitest'

import { getBlobServiceClient, getStorageClient } from './getStorageClient.js'

// Well-known Azurite development storage credentials
const connectionString =
  'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;'

const baseURL = 'https://myaccount.blob.core.windows.net'

const createTokenCredential = (): TokenCredential => ({
  getToken: () =>
    Promise.resolve({ expiresOnTimestamp: Date.now() + 60 * 60 * 1000, token: 'fake-token' }),
})

describe('getStorageClient', () => {
  it('should create a container client from a connection string', () => {
    const client = getStorageClient({
      connectionString,
      containerName: 'connection-string-container',
    })

    expect(client.containerName).toBe('connection-string-container')
    expect(client.accountName).toBe('devstoreaccount1')
  })

  it('should create a container client from a token credential and baseURL', () => {
    const credential = createTokenCredential()

    const client = getStorageClient({
      baseURL,
      containerName: 'credential-container',
      credential,
    })

    expect(client.containerName).toBe('credential-container')
    expect(client.accountName).toBe('myaccount')
    expect(client.credential).toBe(credential)
  })

  it('should cache clients per cache key', () => {
    const options = {
      connectionString,
      containerName: 'cached-container',
    }

    expect(getStorageClient(options)).toBe(getStorageClient(options))
  })

  it('should return the service client backing the container client', () => {
    const credential = createTokenCredential()
    const options = {
      baseURL,
      containerName: 'service-client-container',
      credential,
    }

    const serviceClient = getBlobServiceClient(options)

    expect(serviceClient.accountName).toBe('myaccount')
    expect(serviceClient.credential).toBe(credential)
    expect(getBlobServiceClient(options)).toBe(serviceClient)
  })

  it('should throw when neither connectionString nor credential is provided', () => {
    expect(() =>
      getStorageClient({
        containerName: 'no-auth-container',
      }),
    ).toThrow(/connectionString.*credential/)
  })

  it('should throw when credential is provided without baseURL', () => {
    expect(() =>
      getStorageClient({
        containerName: 'no-base-url-container',
        credential: createTokenCredential(),
      }),
    ).toThrow(/baseURL/)
  })
})
