/* eslint-disable no-param-reassign */

import type { PayloadRequest } from '../../../types'
import type { Document } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import restoreVersion from '../../operations/restoreVersion'

type Resolver = (
  _: unknown,
  args: {
    id: number | string
  },
  context: {
    req: PayloadRequest
    res: Response
  },
) => Promise<Document>
export default function restoreVersionResolver(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context) {
    const options = {
      id: args.id,
      depth: 0,
      globalConfig,
      req: isolateTransactionID(context.req),
    }

    const result = await restoreVersion(options)
    return result
  }
}
