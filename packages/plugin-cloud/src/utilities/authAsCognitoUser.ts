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

  const userPool = new CognitoUserPool({
    ClientId: process.env.PAYLOAD_CLOUD_COGNITO_USER_POOL_CLIENT_ID as string,
    UserPoolId: process.env.PAYLOAD_CLOUD_COGNITO_USER_POOL_ID as string,
  })

  const authenticationDetails = new AuthenticationDetails({
    Username: username,
    Password: password,
  })

  const cognitoUser = new CognitoUser({
    Username: username,
    Pool: userPool,
  })

  const result: CognitoUserSession = await new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: res => {
        resolve(res)
      },
      onFailure: err => {
        reject(err)
      },
    })
  })

  sessionAndToken = result

  return sessionAndToken
}
