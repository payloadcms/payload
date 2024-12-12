import type * as AWS from '@aws-sdk/client-s3'

export type GetStorageClient = () => Promise<{
  identityID: string
  storageClient: AWS.S3
}>

import { identityID, refreshSession, session, storageClient } from './refreshSession.js'

export const getStorageClient: GetStorageClient = async () => {
  if (storageClient && session?.isValid()) {
    return {
      identityID,
      storageClient,
    }
  }

  await refreshSession()

  return {
    identityID,
    storageClient,
  }
}
