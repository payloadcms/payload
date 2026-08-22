import type { PayloadRequest, SelectType } from '../types/index.js'

import { getSelectMode } from '../utilities/getSelectMode.js'
import { resolveBranch } from './resolveBranch.js'
import { branchDocIDField, branchParentField, MAIN_BRANCH } from './types.js'

type ActiveArgs = {
  branch?: false | string
  collectionSlug: string
  req?: Partial<PayloadRequest>
}

/**
 * Whether canonical-ID projection applies to a read.
 *
 * Shared by the projection itself and by the `select` guards below, so the two
 * can never disagree about when a row's ID needs translating — a mismatch there
 * would either leak shadow-row primary keys or strip IDs on main.
 */
export const isBranchProjectionActive = ({ branch, collectionSlug, req }: ActiveArgs): boolean => {
  if (branch === false || !req?.payload) {
    return false
  }

  if ((req.context as Record<string, unknown> | undefined)?._branchBypass) {
    return false
  }

  const branching = req.payload.config?.branching

  if (!branching?.enabled || !branching.branchableCollections.has(collectionSlug)) {
    return false
  }

  return (branch ?? resolveBranch(req as PayloadRequest)) !== MAIN_BRANCH
}

type SelectArgs = {
  select?: SelectType
} & ActiveArgs

const withBranchField = ({
  branch,
  collectionSlug,
  field,
  req,
  select,
}: { field: string } & SelectArgs): SelectType | undefined => {
  if (!select || !isBranchProjectionActive({ branch, collectionSlug, req })) {
    return select
  }

  // Exclude mode returns every column the caller did not name, so the field is
  // already there unless they named it — in which case it has to be un-named.
  if (getSelectMode(select) === 'exclude') {
    if (!(field in select)) {
      return select
    }

    const next = { ...select }
    delete next[field]

    return next
  }

  if (select[field]) {
    return select
  }

  // Cast because spreading the `SelectType` union widens to "include or exclude"
  // and loses the discrimination; the exclude case already returned above.
  return { ...select, [field]: true } as SelectType
}

/**
 * Keeps `_branchDocID` in a collection read's `select`.
 *
 * An include-mode `select` narrows the row to exactly the fields named, which
 * drops `_branchDocID` — and without it there is nothing for the canonical-ID
 * projection to map from, so the read silently returns shadow-row primary keys
 * instead of document IDs. The admin list view selects only its visible columns,
 * which is how this surfaces: correct IDs over the plain REST API, wrong ones in
 * the list, and an unopenable edit view behind every row.
 */
export const withBranchIDSelect = (args: SelectArgs): SelectType | undefined =>
  withBranchField({ ...args, field: branchDocIDField })

/**
 * Keeps `_branchParent` in a version read's `select`, for the same reason
 * {@link withBranchIDSelect} keeps `_branchDocID` in a collection read's.
 */
export const withBranchVersionSelect = (args: SelectArgs): SelectType | undefined =>
  withBranchField({ ...args, field: branchParentField })
