import type { Access } from '../config/types.js'
import type { SanitizedBranchingConfig } from './types.js'

import { defaultAccess } from '../auth/defaultAccess.js'

export type BranchAction = 'discardBranch' | 'mergeBranch'

export const resolveBranchActionAccess = ({
  action,
  branching,
}: {
  action: BranchAction
  branching: SanitizedBranchingConfig
}): Access => {
  if (action === 'mergeBranch') {
    return branching.access?.mergeBranch ?? branching.access?.readBranch ?? defaultAccess
  }

  return branching.access?.discardBranch ?? branching.access?.deleteBranch ?? defaultAccess
}
