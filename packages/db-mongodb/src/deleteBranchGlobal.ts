import type { DeleteBranchGlobal } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'

/**
 * Drops a branch's copy of a global.
 *
 * Every global lives in one discriminated collection here, so the branch's copy is a
 * sibling row identified by `globalType` and `_branch` — addressed directly rather than
 * through any generic delete, since no other part of Payload deletes a global.
 */
export const deleteBranchGlobal: DeleteBranchGlobal = async function deleteBranchGlobal(
  this: MongooseAdapter,
  { branch, globalSlug, req },
) {
  const { Model } = getGlobal({ adapter: this, globalSlug })

  await Model.deleteOne(
    { _branch: branch, globalType: globalSlug },
    { session: await getSession(this, req) },
  )
}
