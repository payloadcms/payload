const find = require('./find');
const findByID = require('./findByID');
const create = require('./create');
const update = require('./update');
const localDelete = require('./delete');

const authOperations = require('../../../auth/operations/local');

module.exports = {
  find,
  findByID,
  create,
  update,
  localDelete,
  auth: authOperations,
};
