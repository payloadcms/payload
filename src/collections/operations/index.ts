import create from './create';
import deleteOperation from './delete';
import find from './find';
import findByID from './findByID';
import findVersionByID from './findVersionByID';
import findVersions from './findVersions';
import restoreVersion from './restoreVersion';
import update from './update';

export default {
  create,
  delete: deleteOperation,
  find,
  findByID,
  findVersionByID,
  findVersions,
  restoreVersion,
  update,
};
