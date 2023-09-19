"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    APIError: function() {
        return _errors.APIError;
    },
    AuthenticationError: function() {
        return _errors.AuthenticationError;
    },
    DuplicateCollection: function() {
        return _errors.DuplicateCollection;
    },
    DuplicateGlobal: function() {
        return _errors.DuplicateGlobal;
    },
    ErrorDeletingFile: function() {
        return _errors.ErrorDeletingFile;
    },
    FileUploadError: function() {
        return _errors.FileUploadError;
    },
    Forbidden: function() {
        return _errors.Forbidden;
    },
    InvalidConfiguration: function() {
        return _errors.InvalidConfiguration;
    },
    InvalidFieldName: function() {
        return _errors.InvalidFieldName;
    },
    InvalidFieldRelationship: function() {
        return _errors.InvalidFieldRelationship;
    },
    LockedAuth: function() {
        return _errors.LockedAuth;
    },
    MissingCollectionLabel: function() {
        return _errors.MissingCollectionLabel;
    },
    MissingFieldInputOptions: function() {
        return _errors.MissingFieldInputOptions;
    },
    MissingFieldType: function() {
        return _errors.MissingFieldType;
    },
    MissingFile: function() {
        return _errors.MissingFile;
    },
    NotFound: function() {
        return _errors.NotFound;
    },
    QueryError: function() {
        return _errors.QueryError;
    },
    ValidationError: function() {
        return _errors.ValidationError;
    }
});
const _errors = require("./dist/errors");

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHBvcnRzL2Vycm9ycy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQge1xuICBBUElFcnJvcixcbiAgQXV0aGVudGljYXRpb25FcnJvcixcbiAgRHVwbGljYXRlQ29sbGVjdGlvbixcbiAgRHVwbGljYXRlR2xvYmFsLFxuICBFcnJvckRlbGV0aW5nRmlsZSxcbiAgRmlsZVVwbG9hZEVycm9yLFxuICBGb3JiaWRkZW4sXG4gIEludmFsaWRDb25maWd1cmF0aW9uLFxuICBJbnZhbGlkRmllbGROYW1lLFxuICBJbnZhbGlkRmllbGRSZWxhdGlvbnNoaXAsXG4gIExvY2tlZEF1dGgsXG4gIE1pc3NpbmdDb2xsZWN0aW9uTGFiZWwsXG4gIE1pc3NpbmdGaWVsZElucHV0T3B0aW9ucyxcbiAgTWlzc2luZ0ZpZWxkVHlwZSxcbiAgTWlzc2luZ0ZpbGUsXG4gIE5vdEZvdW5kLFxuICBRdWVyeUVycm9yLFxuICBWYWxpZGF0aW9uRXJyb3IsXG59IGZyb20gJy4uL2Vycm9ycydcbiJdLCJuYW1lcyI6WyJBUElFcnJvciIsIkF1dGhlbnRpY2F0aW9uRXJyb3IiLCJEdXBsaWNhdGVDb2xsZWN0aW9uIiwiRHVwbGljYXRlR2xvYmFsIiwiRXJyb3JEZWxldGluZ0ZpbGUiLCJGaWxlVXBsb2FkRXJyb3IiLCJGb3JiaWRkZW4iLCJJbnZhbGlkQ29uZmlndXJhdGlvbiIsIkludmFsaWRGaWVsZE5hbWUiLCJJbnZhbGlkRmllbGRSZWxhdGlvbnNoaXAiLCJMb2NrZWRBdXRoIiwiTWlzc2luZ0NvbGxlY3Rpb25MYWJlbCIsIk1pc3NpbmdGaWVsZElucHV0T3B0aW9ucyIsIk1pc3NpbmdGaWVsZFR5cGUiLCJNaXNzaW5nRmlsZSIsIk5vdEZvdW5kIiwiUXVlcnlFcnJvciIsIlZhbGlkYXRpb25FcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFDRUEsUUFBUTtlQUFSQSxnQkFBUTs7SUFDUkMsbUJBQW1CO2VBQW5CQSwyQkFBbUI7O0lBQ25CQyxtQkFBbUI7ZUFBbkJBLDJCQUFtQjs7SUFDbkJDLGVBQWU7ZUFBZkEsdUJBQWU7O0lBQ2ZDLGlCQUFpQjtlQUFqQkEseUJBQWlCOztJQUNqQkMsZUFBZTtlQUFmQSx1QkFBZTs7SUFDZkMsU0FBUztlQUFUQSxpQkFBUzs7SUFDVEMsb0JBQW9CO2VBQXBCQSw0QkFBb0I7O0lBQ3BCQyxnQkFBZ0I7ZUFBaEJBLHdCQUFnQjs7SUFDaEJDLHdCQUF3QjtlQUF4QkEsZ0NBQXdCOztJQUN4QkMsVUFBVTtlQUFWQSxrQkFBVTs7SUFDVkMsc0JBQXNCO2VBQXRCQSw4QkFBc0I7O0lBQ3RCQyx3QkFBd0I7ZUFBeEJBLGdDQUF3Qjs7SUFDeEJDLGdCQUFnQjtlQUFoQkEsd0JBQWdCOztJQUNoQkMsV0FBVztlQUFYQSxtQkFBVzs7SUFDWEMsUUFBUTtlQUFSQSxnQkFBUTs7SUFDUkMsVUFBVTtlQUFWQSxrQkFBVTs7SUFDVkMsZUFBZTtlQUFmQSx1QkFBZTs7O3dCQUNWIn0=