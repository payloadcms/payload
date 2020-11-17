const APIError = require('./APIError');
const AuthenticationError = require('./AuthenticationError');
const DuplicateCollection = require('./DuplicateCollection');
const DuplicateGlobal = require('./DuplicateGlobal');
const ErrorDeletingFile = require('./ErrorDeletingFile');
const errorHandler = require('../express/middleware/errorHandler');
const FileUploadError = require('./FileUploadError');
const Forbidden = require('./Forbidden');
const LockedAuth = require('./LockedAuth');
const InvalidConfiguration = require('./InvalidConfiguration');
const InvalidFieldRelationship = require('./InvalidFieldRelationship');
const MissingCollectionLabel = require('./MissingCollectionLabel');
const MissingFieldInputOptions = require('./MissingFieldInputOptions');
const MissingFieldType = require('./MissingFieldType');
const MissingFile = require('./MissingFile');
const MissingGlobalLabel = require('./MissingGlobalLabel');
const NotFound = require('./NotFound');
const ValidationError = require('./ValidationError');

module.exports = {
  APIError,
  AuthenticationError,
  DuplicateCollection,
  DuplicateGlobal,
  ErrorDeletingFile,
  errorHandler,
  FileUploadError,
  Forbidden,
  LockedAuth,
  InvalidConfiguration,
  InvalidFieldRelationship,
  MissingCollectionLabel,
  MissingFieldInputOptions,
  MissingFieldType,
  MissingFile,
  MissingGlobalLabel,
  NotFound,
  ValidationError,
};
