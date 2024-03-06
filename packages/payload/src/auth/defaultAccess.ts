import type { PayloadRequest } from '../types/index.d.ts'

export default ({ req: { user } }: { req: PayloadRequest }): boolean => Boolean(user)
