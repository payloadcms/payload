import type { CognitoUserSession } from 'amazon-cognito-identity-js'

import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js'

let sessionAndToken: CognitoUserSession | null = null

export const authAsCognitoUser = async (
  username: string,
  password: string,
): Promise<CognitoUserSession> => {
  // TODO: Check that isValid evaluates expiration
  if (sessionAndToken?.isValid()) {
    return sessionAndToken
  }

  if (!process.env.PAYLOAD_CLOUD_COGNITO_USER_POOL_CLIENT_ID) {
    throw new Error('PAYLOAD_CLOUD_COGNITO_USER_POOL_CLIENT_ID is required')
  }
  if (!process.env.PAYLOAD_CLOUD_COGNITO_USER_POOL_ID) {
    throw new Error('PAYLOAD_CLOUD_COGNITO_USER_POOL_ID is required')
  }

  const userPool = new CognitoUserPool({
    ClientId: process.env.PAYLOAD_CLOUD_COGNITO_USER_POOL_CLIENT_ID,
    UserPoolId: process.env.PAYLOAD_CLOUD_COGNITO_USER_POOL_ID,
  })

  const authenticationDetails = new AuthenticationDetails({
    Password: password,
    Username: username,
  })

  const cognitoUser = new CognitoUser({
    Pool: userPool,
    Username: username,
  })

  const result: CognitoUserSession = await new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onFailure: (err: Error) => {
        reject(err)
      },
      onSuccess: (res) => {
        resolve(res)
      },
    })
  })

  sessionAndToken = result

  return sessionAndToken
}
