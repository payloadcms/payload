import type { PayloadRequest } from '../types/index.js'

export default ({ req: { user } }: { req: PayloadRequest }): boolean => Boolean(user)
