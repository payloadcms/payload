import type { PayloadRequest } from '../types/index.js'

export const defaultAccess = ({ req: { payload, user } }: { req: PayloadRequest }): boolean =>
  Boolean(user) && user!.collection === payload.config.admin.user
