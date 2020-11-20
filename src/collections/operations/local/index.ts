import find from './find';
import findByID from './findByID';
import create from './create';
import update from './update';
import localDelete from './delete';

import authOperations from '../../../auth/operations/local';

module.exports = {
  find,
  findByID,
  create,
  update,
  localDelete,
  auth: authOperations,
};
