import { enforceCallDepth } from '../../../utilities/enforceCallDepth.js'
import countGlobalVersions from './countGlobalVersions.js'
import findOne from './findOne.js'
import findVersionByID from './findVersionByID.js'
import findVersions from './findVersions.js'
import restoreVersion from './restoreVersion.js'
import update from './update.js'

const local = {
  countGlobalVersions,
  findOne,
  findVersionByID,
  findVersions,
  restoreVersion,
  update,
}

for (const operation in local) {
  local[operation] = enforceCallDepth(local[operation])
}

export default local
