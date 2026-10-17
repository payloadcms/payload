import type { PayloadRequest } from '../types/index.js'
import type { BranchAction } from './resolveBranchActionAccess.js'

import { assertBranchAccess } from './assertBranchAccess.js'
import { resolveBranchActionAccess } from './resolveBranchActionAccess.js'

export const assertBranchActionAccess = async ({
  action,
  branchDoc,
  req,
}: {
  action: BranchAction
  branchDoc: { id: number | string }
  req: PayloadRequest
}): Promise<void> => {
  const access = resolveBranchActionAccess({
    action,
    branching: req.payload.config.branching,
  })

  await assertBranchAccess({ access, branchDoc, req })
}
