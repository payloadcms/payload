import auth from '../../../auth/operations/local';
import create from './create';
import deleteLocal from './delete';
import find from './find';
import findByID from './findByID';
import findVersionByID from './findVersionByID';
import findVersions from './findVersions';
import restoreVersion from './restoreVersion';
import update from './update';

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
