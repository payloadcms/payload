import type { PayloadRequest } from '../express/types'

export default ({ req: { user } }: { req: PayloadRequest }): boolean => Boolean(user)
