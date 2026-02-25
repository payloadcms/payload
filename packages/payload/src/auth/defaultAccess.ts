import type { PayloadRequest } from '../types/index.js'

export const defaultAccess = ({ req: { user } }: { req: PayloadRequest }): boolean => Boolean(user)
