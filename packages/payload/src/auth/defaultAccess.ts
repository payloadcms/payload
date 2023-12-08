import type { PayloadRequest } from '../types'

export default ({ req: { user } }: { req: PayloadRequest }): boolean => Boolean(user)
