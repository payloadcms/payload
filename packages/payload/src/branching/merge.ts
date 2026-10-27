import type { BlockedChange } from './preflight.js'

import type { MergeableChange, MergeWarning } from './types.js'

import type { BranchMergeValidationError } from './validation.js'

export type MergeResult = {
  /** Changes that cannot be applied because of access or an unavailable dependency. */
  blocked: BlockedChange[]
  /** True when at least one selected change can be applied. */
  canMerge: boolean
  mergeable: MergeableChange[]
  merged: MergeableChange[]
  validationErrors: BranchMergeValidationError[]
  warnings: MergeWarning[]
}
