import type { DeepRequired } from 'ts-essentials'

import type { CollectionSlug, GlobalSlug, Payload } from '../index.js'
import type { PayloadRequest, Where } from '../types/index.js'

export type Permission = {
  permission: boolean
  where?: Record<string, unknown>
}

export type FieldPermissions = {
  blocks?: {
    [blockSlug: string]: {
      fields: {
        [fieldName: string]: FieldPermissions
      }
    }
  }
  create: {
    permission: boolean
  }
  fields?: {
    [fieldName: string]: FieldPermissions
  }
  read: {
    permission: boolean
  }
  update: {
    permission: boolean
  }
}

export type CollectionPermission = {
  create: Permission
  delete: Permission
  fields: {
    [fieldName: string]: FieldPermissions
  }
  read: Permission
  readVersions?: Permission
  update: Permission
}

export type GlobalPermission = {
  fields: {
    [fieldName: string]: FieldPermissions
  }
  read: Permission
  readVersions?: Permission
  update: Permission
}

export type DocumentPermissions = CollectionPermission | GlobalPermission
export type Permissions = {
  canAccessAdmin: boolean
  collections: {
    [collectionSlug: CollectionSlug]: CollectionPermission
  }
  globals?: {
    [globalSlug: GlobalSlug]: GlobalPermission
  }
}

type BaseUser = {
  collection: string
  email?: string
  id: number | string
  username?: string
}

export type User = {
  [key: string]: any
} & BaseUser

/**
 * `collection` is not available one the client. It's only available on the server (req.user)
 * On the client, you can access the collection via config.admin.user. Config can be accessed using the useConfig() hook
 */
export type ClientUser = {
  [key: string]: any
} & BaseUser

type GenerateVerifyEmailHTML<TUser = any> = (args: {
  req: PayloadRequest
  token: string
  user: TUser
}) => Promise<string> | string

type GenerateVerifyEmailSubject<TUser = any> = (args: {
  req: PayloadRequest
  token: string
  user: TUser
}) => Promise<string> | string

type GenerateForgotPasswordEmailHTML<TUser = any> = (args?: {
  req?: PayloadRequest
  token?: string
  user?: TUser
}) => Promise<string> | string

type GenerateForgotPasswordEmailSubject<TUser = any> = (args?: {
  req?: PayloadRequest
  token?: string
  user?: TUser
}) => Promise<string> | string

export type AuthStrategyFunctionArgs = {
  headers: Request['headers']
  isGraphQL?: boolean
  payload: Payload
}

export type AuthStrategyResult = {
  responseHeaders?: Headers
  user: null | User
}

export type AuthStrategyFunction = (
  args: AuthStrategyFunctionArgs,
) => AuthStrategyResult | Promise<AuthStrategyResult>
export type AuthStrategy = {
  authenticate: AuthStrategyFunction
  name: string
}

export type LoginWithUsernameOptions =
  | {
      allowEmailLogin?: false
      requireEmail?: boolean
      // If `allowEmailLogin` is false, `requireUsername` must be true (default: true)
      requireUsername?: true
    }
  | {
      allowEmailLogin?: true
      requireEmail?: boolean
      requireUsername?: boolean
    }

export interface IncomingAuthType {
  /**
   * Set cookie options, including secure, sameSite, and domain. For advanced users.
   */
  cookies?: {
    domain?: string
    sameSite?: 'Lax' | 'None' | 'Strict' | boolean
    secure?: boolean
  }
  /**
   * How many levels deep a user document should be populated when creating the JWT and binding the user to the req. Defaults to 0 and should only be modified if absolutely necessary, as this will affect performance.
   * @default 0
   */
  depth?: number
  /**
   * Advanced - disable Payload's built-in local auth strategy. Only use this property if you have replaced Payload's auth mechanisms with your own.
   */
  disableLocalStrategy?: true
  /**
   * Customize the way that the forgotPassword operation functions.
   * @link https://payloadcms.com/docs/beta/authentication/email#forgot-password
   */
  forgotPassword?: {
    generateEmailHTML?: GenerateForgotPasswordEmailHTML
    generateEmailSubject?: GenerateForgotPasswordEmailSubject
  }
  /**
   * Set the time (in milliseconds) that a user should be locked out if they fail authentication more times than maxLoginAttempts allows for.
   */
  lockTime?: number
  /**
   * Ability to allow users to login with username/password.
   *
   * @link https://payloadcms.com/docs/beta/authentication/overview#login-with-username
   */
  loginWithUsername?: boolean | LoginWithUsernameOptions
  /**
   * Only allow a user to attempt logging in X amount of times. Automatically locks out a user from authenticating if this limit is passed. Set to 0 to disable.
   */
  maxLoginAttempts?: number
  /***
   * Set to true if you want to remove the token from the returned authentication API responses such as login or refresh.
   */
  removeTokenFromResponses?: true
  /**
   * Advanced - an array of custom authentification strategies to extend this collection's authentication with.
   * @link https://payloadcms.com/docs/beta/authentication/custom-strategies
   */
  strategies?: AuthStrategy[]
  /**
   * Controls how many seconds the token will be valid for. Default is 2 hours.
   * @default 7200
   * @link https://payloadcms.com/docs/beta/authentication/overview#config-options
   */
  tokenExpiration?: number
  /**
   * Payload Authentication provides for API keys to be set on each user within an Authentication-enabled Collection.
   * @default false
   * @link https://payloadcms.com/docs/beta/authentication/api-keys
   */
  useAPIKey?: boolean
  /**
   * Set to true or pass an object with verification options to require users to verify by email before they are allowed to log into your app.
   * @link https://payloadcms.com/docs/beta/authentication/email#email-verification
   */
  verify?:
    | {
        generateEmailHTML?: GenerateVerifyEmailHTML
        generateEmailSubject?: GenerateVerifyEmailSubject
      }
    | boolean
}

export type VerifyConfig = {
  generateEmailHTML?: GenerateVerifyEmailHTML
  generateEmailSubject?: GenerateVerifyEmailSubject
}

export interface Auth
  extends Omit<DeepRequired<IncomingAuthType>, 'forgotPassword' | 'loginWithUsername' | 'verify'> {
  forgotPassword?: {
    generateEmailHTML?: GenerateForgotPasswordEmailHTML
    generateEmailSubject?: GenerateForgotPasswordEmailSubject
  }
  loginWithUsername: false | LoginWithUsernameOptions
  verify?: boolean | VerifyConfig
}

export function hasWhereAccessResult(result: boolean | Where): result is Where {
  return result && typeof result === 'object'
}
