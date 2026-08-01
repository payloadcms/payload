import type {
  BlobServiceClient,
  ContainerClient,
  SASQueryParameters,
  UserDelegationKey,
} from '@azure/storage-blob'
import type { GenerateUploadInstructions, UploadInstructionsAccess } from 'payload'

import { isTokenCredential } from '@azure/core-auth'
import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob'
import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { APIError, Forbidden } from 'payload'

const SAS_EXPIRY_MS = 3 * 60 * 60 * 1000

// User delegation keys are requested with twice the SAS lifetime and reused
// while their remaining validity still covers a full SAS window (a user
// delegation SAS becomes invalid once the key it was signed with expires).
const USER_DELEGATION_KEY_LIFETIME_MS = 2 * SAS_EXPIRY_MS
const USER_DELEGATION_KEY_REFRESH_MARGIN_MS = 5 * 60 * 1000

type CachedUserDelegationKey = {
  expiresOn: Date
  key: UserDelegationKey
}

const userDelegationKeys = new WeakMap<BlobServiceClient, CachedUserDelegationKey>()

interface Args {
  access?: UploadInstructionsAccess
  collectionPrefix: string
  containerName: string
  getBlobServiceClient: () => BlobServiceClient
  getStorageClient: () => ContainerClient
  useCompositePrefixes?: boolean
}

export const generateUploadInstructions = ({
  access,
  collectionPrefix,
  containerName,
  getBlobServiceClient,
  getStorageClient,
  useCompositePrefixes = false,
}: Args): GenerateUploadInstructions => {
  return async ({
    collectionSlug,
    docPrefix,
    filename,
    filesize,
    mimeType,
    overrideAccess,
    req,
  }) => {
    if (!overrideAccess && (access ? !(await access({ collectionSlug, req })) : !req.user)) {
      throw new Forbidden(req.t)
    }

    const { fileKey, sanitizedDocPrefix, sanitizedFilename } = await resolveSignedURLKey({
      collectionPrefix,
      collectionSlug,
      docPrefix,
      filename,
      req,
      useCompositePrefixes,
    })

    const containerClient = getStorageClient()
    const blobClient = containerClient.getBlobClient(fileKey)

    const sasOptions = {
      blobName: fileKey,
      containerName,
      contentType: mimeType,
      expiresOn: new Date(Date.now() + SAS_EXPIRY_MS),
      permissions: BlobSASPermissions.parse('w'),
      startsOn: new Date(),
    }

    const { credential } = containerClient

    let sasToken: SASQueryParameters

    if (credential instanceof StorageSharedKeyCredential) {
      sasToken = generateBlobSASQueryParameters(sasOptions, credential)
    } else if (isTokenCredential(credential)) {
      const userDelegationKey = await getUserDelegationKey({
        serviceClient: getBlobServiceClient(),
      })

      sasToken = generateBlobSASQueryParameters(
        sasOptions,
        userDelegationKey,
        containerClient.accountName,
      )
    } else {
      throw new APIError(
        'Azure Blob storage: client uploads require an account-key connection string or an Entra `credential` — the configured credential cannot sign upload URLs (SAS-based connection strings are not supported for client uploads)',
      )
    }

    return {
      name: 'uploadToAzure',
      type: 'dispatch',
      data: {
        url: `${blobClient.url}?${sasToken.toString()}`,
      },
      file: {
        filename: sanitizedFilename,
        mimeType,
        size: filesize,
        uploadReference: { prefix: sanitizedDocPrefix },
      },
    }
  }
}

async function getUserDelegationKey({
  serviceClient,
}: {
  serviceClient: BlobServiceClient
}): Promise<UserDelegationKey> {
  const cached = userDelegationKeys.get(serviceClient)

  const remainingValidityMs = cached ? cached.expiresOn.getTime() - Date.now() : 0

  if (cached && remainingValidityMs > SAS_EXPIRY_MS + USER_DELEGATION_KEY_REFRESH_MARGIN_MS) {
    return cached.key
  }

  const startsOn = new Date()
  const expiresOn = new Date(Date.now() + USER_DELEGATION_KEY_LIFETIME_MS)

  const key = await serviceClient.getUserDelegationKey(startsOn, expiresOn)

  userDelegationKeys.set(serviceClient, { expiresOn, key })

  return key
}
