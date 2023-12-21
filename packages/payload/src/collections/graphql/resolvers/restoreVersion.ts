/* eslint-disable no-param-reassign */
import type { Response } from 'express'

import type { PayloadRequest } from '../../../types'
import type { Collection } from '../../config/types'

<<<<<<< HEAD
import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import restoreVersion from '../../operations/restoreVersion'
=======
import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { restoreVersionOperation } from '../../operations/restoreVersion'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

export type Resolver = (
  _: unknown,
  args: {
    id: number | string
  },
  context: {
    req: PayloadRequest
    res: Response
  },
) => Promise<Document>

export default function restoreVersionResolver(collection: Collection): Resolver {
  async function resolver(_, args, context) {
    const options = {
      id: args.id,
      collection,
      depth: 0,
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    }

    const result = await restoreVersionOperation(options)
    return result
  }

  return resolver
}
