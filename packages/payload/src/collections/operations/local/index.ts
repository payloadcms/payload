import auth from '../../../auth/operations/local/index.js'
import count from './count.js'
import create from './create.js'
import deleteLocal from './delete.js'
import { duplicate } from './duplicate.js'
import find from './find.js'
import findByID from './findByID.js'
import findVersionByID from './findVersionByID.js'
import findVersions from './findVersions.js'
import restoreVersion from './restoreVersion.js'
import update from './update.js'

export default {
  auth,
  count,
  create,
  deleteLocal,
  duplicate,
  find,
  findByID,
  findVersionByID,
  findVersions,
  restoreVersion,
  update,
}
