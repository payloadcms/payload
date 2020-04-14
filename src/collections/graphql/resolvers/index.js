const findByID = require('./findByID');
const find = require('./find');
const create = require('./create');
const update = require('./update');
const deleteResolver = require('./delete');

module.exports = {
  findByID,
  find,
  create,
  update,
  deleteResolver,
};
