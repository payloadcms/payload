/* eslint-disable no-param-reassign */

import type { PayloadRequest } from '../../../types'
import type { Document } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

<<<<<<< HEAD
import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import restoreVersion from '../../operations/restoreVersion'
=======
import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { restoreVersionOperation } from '../../operations/restoreVersion'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

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
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    }

    const result = await restoreVersionOperation(options)
    return result
  }
}
