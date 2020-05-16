const APIError = require('./APIError');
const AuthenticationError = require('./AuthenticationError');
const DuplicateCollection = require('./DuplicateCollection');
const DuplicateGlobal = require('./DuplicateGlobal');
const MissingCollectionLabel = require('./MissingCollectionLabel');
const MissingGlobalLabel = require('./MissingGlobalLabel');
const MissingUseAsTitle = require('./MissingUseAsTitle');
const NotFound = require('./NotFound');
const Forbidden = require('./Forbidden');
const ValidationError = require('./ValidationError');
const MissingFile = require('./MissingFile');

module.exports = {
  APIError,
  AuthenticationError,
  DuplicateCollection,
  DuplicateGlobal,
  MissingCollectionLabel,
  MissingGlobalLabel,
  MissingUseAsTitle,
  NotFound,
  Forbidden,
  ValidationError,
  MissingFile,
};
