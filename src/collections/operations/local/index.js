const find = require('./find');
const findOne = require('./findOne');
const create = require('./create');
const update = require('./update');
const localDelete = require('./delete');

const authOperations = require('../../../auth/operations/local');

module.exports = {
  find,
  findOne,
  create,
  update,
  localDelete,
  auth: authOperations,
};
