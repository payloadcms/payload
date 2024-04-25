import type { PayloadRequestWithData } from '../types/index.js'

export default ({ req: { user } }: { req: PayloadRequestWithData }): boolean => Boolean(user)
