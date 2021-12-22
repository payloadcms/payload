import find from './find';
import findByID from './findByID';
import create from './create';
import update from './update';
import localDelete from './delete';
import auth from '../../../auth/operations/local';
import findRevisionByID from './findRevisionByID';
import findRevisions from './findRevisions';
import restoreRevision from './restoreRevision';

export default {
  find,
  findByID,
  create,
  update,
  localDelete,
  auth,
  findRevisionByID,
  findRevisions,
  restoreRevision,
};
