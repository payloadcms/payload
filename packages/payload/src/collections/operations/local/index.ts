import find from './find.js';
import findByID from './findByID.js';
import create from './create.js';
import update from './update.js';
import deleteLocal from './delete.js';
import auth from '../../../auth/operations/local/index.js';
import findVersionByID from './findVersionByID.js';
import findVersions from './findVersions.js';
import restoreVersion from './restoreVersion.js';

export default {
  find,
  findByID,
  create,
  update,
  deleteLocal,
  auth,
  findVersionByID,
  findVersions,
  restoreVersion,
};
