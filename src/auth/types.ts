import { DeepRequired } from 'ts-essentials';
import { PayloadRequest } from '../express/types/payloadRequest';

export type Permission = {
  permission: boolean
  where?: Record<string, unknown>
}

export type CollectionFieldPermissions = {
  [field: string]: {
    create: {
      permission: boolean
    }
    read: {
      permission: boolean
    }
    update: {
      permission: boolean
    }
    delete: {
      permission: boolean
    }
  }
}

export type CollectionPermission = {
  create: Permission
  read: Permission
  update: Permission
  delete: Permission
  fields: CollectionFieldPermissions
}

export type GlobalFieldPermissions = {
  [field: string]: {
    read: {
      permission: boolean
    }
    update: {
      permission: boolean
    }
  }
}

export type GlobalPermission = {
  read: Permission
  update: Permission
  fields: GlobalFieldPermissions
}

export type Permissions = {
  canAccessAdmin: boolean
  license?: string
  collections: CollectionPermission[]
  globals?: GlobalPermission[]
}

export type User = {
  id: string
  email: string
  [key: string]: unknown
}

type GenerateVerifyEmailHTML = (args: { req: PayloadRequest, token: string, user: any}) => Promise<string> | string
type GenerateVerifyEmailSubject = (args: { req: PayloadRequest, token: string, user: any}) => Promise<string> | string

type GenerateForgotPasswordEmailHTML = (args?: { token?: string, email?: string, req?: PayloadRequest }) => Promise<string> | string
type GenerateForgotPasswordEmailSubject = (args?: { req?: PayloadRequest }) => Promise<string> | string

export interface IncomingAuthType {
  tokenExpiration?: number;
  verify?:
  | boolean
  | {
    generateEmailHTML?: GenerateVerifyEmailHTML;
    generateEmailSubject?: GenerateVerifyEmailSubject;
  };
  maxLoginAttempts?: number;
  lockTime?: number;
  useAPIKey?: boolean;
  depth?: number
  cookies?: {
    secure?: boolean;
    sameSite?: string;
    domain?: string;
  }
  forgotPassword?: {
    generateEmailHTML?: GenerateForgotPasswordEmailHTML,
    generateEmailSubject?: GenerateForgotPasswordEmailSubject,
  }
}

export interface Auth extends Omit<DeepRequired<IncomingAuthType>, 'verify' | 'forgotPassword'> {
  verify?: {
    generateEmailHTML?: GenerateVerifyEmailHTML
    generateEmailSubject?: GenerateVerifyEmailSubject
  } | boolean
  forgotPassword?: {
    generateEmailHTML?: GenerateForgotPasswordEmailHTML
    generateEmailSubject?: GenerateForgotPasswordEmailSubject
  }
}
