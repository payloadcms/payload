import * as AWS from '@aws-sdk/client-s3'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import type { CognitoUserSession } from 'amazon-cognito-identity-js'
import { authAsCognitoUser } from './authAsCognitoUser'

export type GetStorageClient = () => Promise<{
  storageClient: AWS.S3
  identityID: string
}>

let storageClient: AWS.S3 | null = null
let session: CognitoUserSession | null = null
let identityID: string

export const getStorageClient: GetStorageClient = async () => {
  if (storageClient && session?.isValid()) {
    return {
      storageClient,
      identityID,
    }
  }

  session = await authAsCognitoUser(
    process.env.PAYLOAD_CLOUD_PROJECT_ID as string,
    process.env.PAYLOAD_CLOUD_COGNITO_PASSWORD as string,
  )

  const cognitoIdentity = new CognitoIdentityClient({
    credentials: fromCognitoIdentityPool({
      identityPoolId: process.env.PAYLOAD_CLOUD_COGNITO_IDENTITY_POOL_ID as string,
      logins: {
        [`cognito-idp.us-east-1.amazonaws.com/${process.env.PAYLOAD_CLOUD_COGNITO_USER_POOL_ID}`]:
          session.getIdToken().getJwtToken(),
      },
    }),
  })

  const credentials = await cognitoIdentity.config.credentials()

  // @ts-expect-error
  identityID = credentials.identityId

  storageClient = new AWS.S3({
    region: process.env.PAYLOAD_CLOUD_BUCKET_REGION,
    credentials,
  })

  return {
    storageClient,
    identityID,
  }
}
