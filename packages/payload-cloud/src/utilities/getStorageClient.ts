import type * as AWS from '@aws-sdk/client-s3'
import type { CognitoUserSession } from 'amazon-cognito-identity-js'

import type { GetStorageClient } from './refreshSession.js'

import { refreshSession } from './refreshSession.js'

export let storageClient: AWS.S3 | null = null
export let session: CognitoUserSession | null = null
export let identityID: string

export const getStorageClient: GetStorageClient = async () => {
  if (storageClient && session?.isValid()) {
    return {
      identityID,
      storageClient,
    }
  }

  ;({ identityID, session, storageClient } = await refreshSession())

  if (!process.env.PAYLOAD_CLOUD_PROJECT_ID) {
    throw new Error('PAYLOAD_CLOUD_PROJECT_ID is required')
  }
  if (!process.env.PAYLOAD_CLOUD_COGNITO_PASSWORD) {
    throw new Error('PAYLOAD_CLOUD_COGNITO_PASSWORD is required')
  }
  if (!process.env.PAYLOAD_CLOUD_COGNITO_IDENTITY_POOL_ID) {
    throw new Error('PAYLOAD_CLOUD_COGNITO_IDENTITY_POOL_ID is required')
  }

  return {
    identityID,
    storageClient,
  }
}
