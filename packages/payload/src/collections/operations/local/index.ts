import auth from '../../../auth/operations/local/index.js';
import create from './create.js';
import deleteLocal from './delete.js';
import find from './find.js';
import findByID from './findByID.js';
import findVersionByID from './findVersionByID.js';
import findVersions from './findVersions.js';
import restoreVersion from './restoreVersion.js';
import update from './update.js';

export default {
  auth,
  create,
  deleteLocal,
  find,
  findByID,
  findVersionByID,
  findVersions,
  restoreVersion,
  update,
};
