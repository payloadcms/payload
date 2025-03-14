import type { PayloadRequest } from 'payload/dist/express/types'

export type AllowUsers = (req: PayloadRequest) => Promise<boolean> | boolean

export interface PasswordProtectionConfig {
  passwordFieldName?: string
  passwordProtectedFieldName?: string
  whitelistUsers?: AllowUsers
  routePath?: string
  mutationName?: string
  expiration?: number
  collections?: string[]
}

export interface PasswordProtectionOptions {
  collections?: string[]
  routePath: string
  expiration: number
  whitelistUsers: AllowUsers
  passwordFieldName: string
  passwordProtectedFieldName: string
  mutationName: string
}
