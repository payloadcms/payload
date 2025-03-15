import type { DeepRequired } from 'ts-essentials'

import type { CollectionSlug, GlobalSlug, Payload } from '../index.js'
import type { PayloadRequest, Where } from '../types/index.js'

/**
 * A permission object that can be used to determine if a user has access to a specific operation.
 */
export type Permission = {
  permission: boolean
  where?: Where
}

export type FieldsPermissions = {
  [fieldName: string]: FieldPermissions
}

export type BlockPermissions = {
  create: Permission
  fields: FieldsPermissions
  read: Permission
  update: Permission
}

export type SanitizedBlockPermissions =
  | {
      fields: SanitizedFieldsPermissions
    }
  | true

export type BlocksPermissions = {
  [blockSlug: string]: BlockPermissions
}

export type SanitizedBlocksPermissions =
  | {
      [blockSlug: string]: SanitizedBlockPermissions
    }
  | true

export type FieldPermissions = {
  blocks?: BlocksPermissions
  create: Permission
  fields?: FieldsPermissions
  read: Permission
  update: Permission
}

export type SanitizedFieldPermissions =
  | {
      blocks?: SanitizedBlocksPermissions
      create: true
      fields?: SanitizedFieldsPermissions
      read: true
      update: true
    }
  | true

export type SanitizedFieldsPermissions =
  | {
      [fieldName: string]: SanitizedFieldPermissions
    }
  | true

export type CollectionPermission = {
  create: Permission
  delete: Permission
  fields: FieldsPermissions
  read: Permission
  readVersions?: Permission
  update: Permission
}

export type SanitizedCollectionPermission = {
  create?: true
  delete?: true
  fields: SanitizedFieldsPermissions
  read?: true
  readVersions?: true
  update?: true
}

export type GlobalPermission = {
  fields: FieldsPermissions
  read: Permission
  readVersions?: Permission
  update: Permission
}

export type SanitizedGlobalPermission = {
  fields: SanitizedFieldsPermissions
  read?: true
  readVersions?: true
  update?: true
}

export type DocumentPermissions = CollectionPermission | GlobalPermission

export type SanitizedDocumentPermissions = SanitizedCollectionPermission | SanitizedGlobalPermission

export type Permissions = {
  canAccessAdmin: boolean
  collections?: Record<CollectionSlug, CollectionPermission>
  globals?: Record<GlobalSlug, GlobalPermission>
}

export type SanitizedPermissions = {
  canAccessAdmin?: boolean
  collections?: {
    [collectionSlug: string]: SanitizedCollectionPermission
  }
  globals?: {
    [globalSlug: string]: SanitizedGlobalPermission
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
  /**
   * The AuthStrategy name property from the payload config.
   */
  strategyName?: string
}

export type AuthStrategyResult = {
  responseHeaders?: Headers
  user:
    | ({
        _strategy?: string
        collection?: string
      } & User)
    | null
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
  disableLocalStrategy?:
    | {
        /**
         * Include auth fields on the collection even though the local strategy is disabled.
         * Useful when you do not want the database or types to vary depending on the auth configuration.
         */
        enableFields?: true
        optionalPassword?: true
      }
    | true
  /**
   * Customize the way that the forgotPassword operation functions.
   * @link https://payloadcms.com/docs/authentication/email#forgot-password
   */
  forgotPassword?: {
    /**
     * The number of milliseconds that the forgot password token should be valid for.
     * @default 3600000 // 1 hour
     */
    expiration?: number
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
   * @link https://payloadcms.com/docs/authentication/overview#login-with-username
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
   * @link https://payloadcms.com/docs/authentication/custom-strategies
   */
  strategies?: AuthStrategy[]
  /**
   * Controls how many seconds the token will be valid for. Default is 2 hours.
   * @default 7200
   * @link https://payloadcms.com/docs/authentication/overview#config-options
   */
  tokenExpiration?: number
  /**
   * Payload Authentication provides for API keys to be set on each user within an Authentication-enabled Collection.
   * @default false
   * @link https://payloadcms.com/docs/authentication/api-keys
   */
  useAPIKey?: boolean
  /**
   * Set to true or pass an object with verification options to require users to verify by email before they are allowed to log into your app.
   * @link https://payloadcms.com/docs/authentication/email#email-verification
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
    expiration?: number
    generateEmailHTML?: GenerateForgotPasswordEmailHTML
    generateEmailSubject?: GenerateForgotPasswordEmailSubject
  }
  loginWithUsername: false | LoginWithUsernameOptions
  verify?: boolean | VerifyConfig
}

export function hasWhereAccessResult(result: boolean | Where): result is Where {
  return result && typeof result === 'object'
}
