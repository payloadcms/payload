const APIError = require('./APIError');
const AuthenticationError = require('./AuthenticationError');
const DuplicateCollection = require('./DuplicateCollection');
const DuplicateGlobal = require('./DuplicateGlobal');
const MissingCollectionLabel = require('./MissingCollectionLabel');
const MissingGlobalLabel = require('./MissingGlobalLabel');
const NotFound = require('./NotFound');
const Forbidden = require('./Forbidden');
const ValidationError = require('./ValidationError');
const errorHandler = require('../express/middleware/errorHandler');
const MissingFile = require('./MissingFile');
const MissingFieldInputOptions = require('./MissingFieldInputOptions');
const ErrorDeletingFile = require('./ErrorDeletingFile');

module.exports = {
  errorHandler,
  ErrorDeletingFile,
  APIError,
  AuthenticationError,
  DuplicateCollection,
  DuplicateGlobal,
  MissingCollectionLabel,
  MissingGlobalLabel,
  NotFound,
  Forbidden,
  ValidationError,
  MissingFile,
  MissingFieldInputOptions,
};
