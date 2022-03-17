import { PayloadRequest } from 'payload/dist/express/types';

export type AllowUsers = (req: PayloadRequest) => Promise<boolean> | boolean;

export type PasswordProtectionConfig = {
  passwordFieldName?: string
  passwordProtectedFieldName?: string
  whitelistUsers?: AllowUsers
  routePath?: string
  mutationName?: string
  expiration?: number
  collections?: string[]
}
