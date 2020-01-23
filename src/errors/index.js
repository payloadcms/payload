const APIError = require('./APIError');
const DuplicateCollection = require('./DuplicateCollection');
const DuplicateGlobal = require('./DuplicateGlobal');
const MissingCollectionLabel = require('./MissingCollectionLabel');
const MissingGlobalLabel = require('./MissingGlobalLabel');
const NotFound = require('./NotFound');
const Forbidden = require('./Forbidden');

module.exports = {
  APIError,
  DuplicateCollection,
  DuplicateGlobal,
  MissingCollectionLabel,
  MissingGlobalLabel,
  NotFound,
  Forbidden,
};
