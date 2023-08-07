import find from './find';
import findByID from './findByID';
import create from './create';
import update from './update';
import deleteLocal from './delete';
import auth from '../../../auth/operations/local';
import findVersionByID from './findVersionByID';
import findVersions from './findVersions';
import restoreVersion from './restoreVersion';

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
