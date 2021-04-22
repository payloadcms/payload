import { PayloadRequest } from 'payload/dist/express/types';

export type AllowUsers = (req: PayloadRequest) => boolean;

export type Options = {
  passwordFieldName?: string
  passwordProtectedFieldName?: string
  whitelistUsers?: AllowUsers
  routePath?: string
  mutationName?: string
  expiration?: number
  slugs: string[]
}
