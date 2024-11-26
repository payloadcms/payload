/* eslint-disable no-restricted-exports */
import * as auth from '../../../auth/operations/local/index.js'
import { enforceCallDepth } from '../../../utilities/enforceCallDepth.js'
import count from './count.js'
import countVersions from './countVersions.js'
import create from './create.js'
import deleteLocal from './delete.js'
import { duplicate } from './duplicate.js'
import { findLocal } from './find.js'
import findByID from './findByID.js'
import findVersionByID from './findVersionByID.js'
import findVersions from './findVersions.js'
import restoreVersion from './restoreVersion.js'
import update from './update.js'

const local = {
  auth,
  count,
  countVersions,
  create,
  deleteLocal,
  duplicate,
  find: findLocal,
  findByID,
  findVersionByID,
  findVersions,
  restoreVersion,
  update,
}

for (const operation in local) {
  if (typeof local[operation] === 'function') {
    local[operation] = enforceCallDepth(local[operation])
  }
}

for (const operation in local.auth) {
  local.auth[operation] = enforceCallDepth(local.auth[operation])
}

export default local
