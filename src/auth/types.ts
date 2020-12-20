import { DeepRequired } from 'ts-essentials';
import { PayloadRequest } from '../express/types/payloadRequest';

export type Permission = {
  permission: boolean
  where?: Record<string, unknown>
}

export type FieldPermissions = {
  create: {
    permission: boolean
  }
  read: {
    permission: boolean
  }
  update: {
    permission: boolean
  }
  fields?: {
    [field: string]: FieldPermissions
  }
}

export type CollectionPermission = {
  create: Permission
  read: Permission
  update: Permission
  delete: Permission
  fields: {
    [field: string]: FieldPermissions
  }
}

export type GlobalPermission = {
  read: Permission
  update: Permission
  fields: {
    [field: string]: FieldPermissions
  }
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

type GenerateForgotPasswordEmailHTML = (args?: { req?: PayloadRequest, token?: string, user?: string}) => Promise<string> | string
type GenerateForgotPasswordEmailSubject = (args?: { req?: PayloadRequest, token?: string, user?: any }) => Promise<string> | string

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
    sameSite?: boolean | 'none' | 'strict' | 'lax';
    domain?: string;
  }
  forgotPassword?: {
    generateEmailHTML?: GenerateForgotPasswordEmailHTML,
    generateEmailSubject?: GenerateForgotPasswordEmailSubject,
  }
}

export type VerifyConfig = {
  generateEmailHTML?: GenerateVerifyEmailHTML
  generateEmailSubject?: GenerateVerifyEmailSubject
} | boolean;

export interface Auth extends Omit<DeepRequired<IncomingAuthType>, 'verify' | 'forgotPassword'> {
  verify?: VerifyConfig
  forgotPassword?: {
    generateEmailHTML?: GenerateForgotPasswordEmailHTML
    generateEmailSubject?: GenerateForgotPasswordEmailSubject
  }
}
