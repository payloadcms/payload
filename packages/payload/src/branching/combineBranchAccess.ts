import type { Access } from '../config/types.js'
import type { Where } from '../types/index.js'

import { hasWhereAccessResult } from '../auth/types.js'

export const combineBranchAccess =
  ({ readAccess, writeAccess }: { readAccess: Access; writeAccess: Access }): Access =>
  async (args) => {
    const [readResult, writeResult] = await Promise.all([readAccess(args), writeAccess(args)])

    if (!readResult || !writeResult) {
      return false
    }

    const constraints: Where[] = []

    if (hasWhereAccessResult(readResult)) {
      constraints.push(readResult)
    }

    if (hasWhereAccessResult(writeResult)) {
      constraints.push(writeResult)
    }

    return constraints.length ? { and: constraints } : true
  }
