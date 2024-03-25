import type { Strategy } from 'passport'
import type { DeepRequired } from 'ts-essentials'

import type { PayloadRequest } from '../express/types'
import type { Payload } from '../payload'
import type { Where } from '../types'

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

export type Permissions = {
  canAccessAdmin: boolean
  collections: {
    [collectionSlug: string]: CollectionPermission
  }
  globals?: {
    [globalSlug: string]: GlobalPermission
  }
}

export type User = {
  [key: string]: unknown
  collection: string
  email: string
  id: string
}

type GenerateVerifyEmailHTML = (args: {
  req: PayloadRequest
  token: string
  user: any
}) => Promise<string> | string
type GenerateVerifyEmailSubject = (args: {
  req: PayloadRequest
  token: string
  user: any
}) => Promise<string> | string

type GenerateForgotPasswordEmailHTML = (args: {
  req: PayloadRequest
  token: string
  user: any
}) => Promise<string> | string
type GenerateForgotPasswordEmailSubject = (args: {
  req: PayloadRequest
  token: string
  user: any
}) => Promise<string> | string

type AuthStrategy = ((ctx: Payload) => Strategy) | Strategy

export interface IncomingAuthType {
  cookies?: {
    domain?: string
    sameSite?: 'lax' | 'none' | 'strict' | boolean
    secure?: boolean
  }
  depth?: number
  disableLocalStrategy?: true
  forgotPassword?: {
    generateEmailHTML?: GenerateForgotPasswordEmailHTML
    generateEmailSubject?: GenerateForgotPasswordEmailSubject
  }
  lockTime?: number
  maxLoginAttempts?: number
  removeTokenFromResponses?: true
  strategies?: {
    name?: string
    strategy: AuthStrategy
  }[]
  tokenExpiration?: number
  useAPIKey?: boolean
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

export interface Auth extends Omit<DeepRequired<IncomingAuthType>, 'forgotPassword' | 'verify'> {
  forgotPassword?: {
    generateEmailHTML?: GenerateForgotPasswordEmailHTML
    generateEmailSubject?: GenerateForgotPasswordEmailSubject
  }
  verify?: VerifyConfig | boolean
}

export function hasWhereAccessResult(result: Where | boolean): result is Where {
  return result && typeof result === 'object'
}
