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
    BeginTransaction: function() {
        return _types.BeginTransaction;
    },
    CommitTransaction: function() {
        return _types.CommitTransaction;
    },
    Connect: function() {
        return _types.Connect;
    },
    Create: function() {
        return _types.Create;
    },
    CreateArgs: function() {
        return _types.CreateArgs;
    },
    CreateGlobal: function() {
        return _types.CreateGlobal;
    },
    CreateGlobalArgs: function() {
        return _types.CreateGlobalArgs;
    },
    CreateGlobalVersion: function() {
        return _types.CreateGlobalVersion;
    },
    CreateGlobalVersionArgs: function() {
        return _types.CreateGlobalVersionArgs;
    },
    CreateMigration: function() {
        return _types.CreateMigration;
    },
    CreateVersion: function() {
        return _types.CreateVersion;
    },
    CreateVersionArgs: function() {
        return _types.CreateVersionArgs;
    },
    DatabaseAdapter: function() {
        return _types.DatabaseAdapter;
    },
    DeleteMany: function() {
        return _types.DeleteMany;
    },
    DeleteManyArgs: function() {
        return _types.DeleteManyArgs;
    },
    DeleteOne: function() {
        return _types.DeleteOne;
    },
    DeleteOneArgs: function() {
        return _types.DeleteOneArgs;
    },
    DeleteVersions: function() {
        return _types.DeleteVersions;
    },
    DeleteVersionsArgs: function() {
        return _types.DeleteVersionsArgs;
    },
    Destroy: function() {
        return _types.Destroy;
    },
    Find: function() {
        return _types.Find;
    },
    FindArgs: function() {
        return _types.FindArgs;
    },
    FindGlobal: function() {
        return _types.FindGlobal;
    },
    FindGlobalArgs: function() {
        return _types.FindGlobalArgs;
    },
    FindGlobalVersions: function() {
        return _types.FindGlobalVersions;
    },
    FindGlobalVersionsArgs: function() {
        return _types.FindGlobalVersionsArgs;
    },
    FindOne: function() {
        return _types.FindOne;
    },
    FindOneArgs: function() {
        return _types.FindOneArgs;
    },
    FindVersions: function() {
        return _types.FindVersions;
    },
    FindVersionsArgs: function() {
        return _types.FindVersionsArgs;
    },
    Init: function() {
        return _types.Init;
    },
    Migration: function() {
        return _types.Migration;
    },
    MigrationData: function() {
        return _types.MigrationData;
    },
    PaginatedDocs: function() {
        return _types.PaginatedDocs;
    },
    QueryDrafts: function() {
        return _types.QueryDrafts;
    },
    QueryDraftsArgs: function() {
        return _types.QueryDraftsArgs;
    },
    RollbackTransaction: function() {
        return _types.RollbackTransaction;
    },
    Transaction: function() {
        return _types.Transaction;
    },
    UpdateGlobal: function() {
        return _types.UpdateGlobal;
    },
    UpdateGlobalArgs: function() {
        return _types.UpdateGlobalArgs;
    },
    UpdateOne: function() {
        return _types.UpdateOne;
    },
    UpdateOneArgs: function() {
        return _types.UpdateOneArgs;
    },
    UpdateVersion: function() {
        return _types.UpdateVersion;
    },
    UpdateVersionArgs: function() {
        return _types.UpdateVersionArgs;
    },
    Webpack: function() {
        return _types.Webpack;
    },
    combineQueries: function() {
        return _combineQueries.combineQueries;
    },
    createDatabaseAdapter: function() {
        return _createDatabaseAdapter.createDatabaseAdapter;
    },
    flattenWhereToOperators: function() {
        return _flattenWhereToOperators.default;
    },
    getLocalizedPaths: function() {
        return _getLocalizedPaths.getLocalizedPaths;
    },
    createMigration: function() {
        return _createMigration.createMigration;
    },
    getMigrations: function() {
        return _getMigrations.getMigrations;
    },
    migrate: function() {
        return _migrate.migrate;
    },
    migrateDown: function() {
        return _migrateDown.migrateDown;
    },
    migrateRefresh: function() {
        return _migrateRefresh.migrateRefresh;
    },
    migrateReset: function() {
        return _migrateReset.migrateReset;
    },
    migrateStatus: function() {
        return _migrateStatus.migrateStatus;
    },
    migrationTemplate: function() {
        return _migrationTemplate.migrationTemplate;
    },
    migrationsCollection: function() {
        return _migrationsCollection.migrationsCollection;
    },
    readMigrationFiles: function() {
        return _readMigrationFiles.readMigrationFiles;
    },
    EntityPolicies: function() {
        return _types1.EntityPolicies;
    },
    PathToQuery: function() {
        return _types1.PathToQuery;
    },
    validateQueryPaths: function() {
        return _validateQueryPaths.validateQueryPaths;
    },
    validateSearchParam: function() {
        return _validateSearchParams.validateSearchParam;
    },
    transaction: function() {
        return _transaction.transaction;
    }
});
const _types = require("./dist/database/types");
const _types1 = _export_star(require("./dist/database/queryValidation/types"), exports);
const _combineQueries = require("./dist/database/combineQueries");
const _createDatabaseAdapter = require("./dist/database/createDatabaseAdapter");
const _flattenWhereToOperators = /*#__PURE__*/ _interop_require_default(require("./dist/database/flattenWhereToOperators"));
const _getLocalizedPaths = require("./dist/database/getLocalizedPaths");
const _createMigration = require("./dist/database/migrations/createMigration");
const _getMigrations = require("./dist/database/migrations/getMigrations");
const _migrate = require("./dist/database/migrations/migrate");
const _migrateDown = require("./dist/database/migrations/migrateDown");
const _migrateRefresh = require("./dist/database/migrations/migrateRefresh");
const _migrateReset = require("./dist/database/migrations/migrateReset");
const _migrateStatus = require("./dist/database/migrations/migrateStatus");
const _migrationTemplate = require("./dist/database/migrations/migrationTemplate");
const _migrationsCollection = require("./dist/database/migrations/migrationsCollection");
const _readMigrationFiles = require("./dist/database/migrations/readMigrationFiles");
const _validateQueryPaths = require("./dist/database/queryValidation/validateQueryPaths");
const _validateSearchParams = require("./dist/database/queryValidation/validateSearchParams");
const _transaction = require("./dist/database/transaction");
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHBvcnRzL2RhdGFiYXNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7XG4gIEJlZ2luVHJhbnNhY3Rpb24sXG4gIENvbW1pdFRyYW5zYWN0aW9uLFxuICBDb25uZWN0LFxuICBDcmVhdGUsXG4gIENyZWF0ZUFyZ3MsXG4gIENyZWF0ZUdsb2JhbCxcbiAgQ3JlYXRlR2xvYmFsQXJncyxcbiAgQ3JlYXRlR2xvYmFsVmVyc2lvbixcbiAgQ3JlYXRlR2xvYmFsVmVyc2lvbkFyZ3MsXG4gIENyZWF0ZU1pZ3JhdGlvbixcbiAgQ3JlYXRlVmVyc2lvbixcbiAgQ3JlYXRlVmVyc2lvbkFyZ3MsXG4gIERhdGFiYXNlQWRhcHRlcixcbiAgRGVsZXRlTWFueSxcbiAgRGVsZXRlTWFueUFyZ3MsXG4gIERlbGV0ZU9uZSxcbiAgRGVsZXRlT25lQXJncyxcbiAgRGVsZXRlVmVyc2lvbnMsXG4gIERlbGV0ZVZlcnNpb25zQXJncyxcbiAgRGVzdHJveSxcbiAgRmluZCxcbiAgRmluZEFyZ3MsXG4gIEZpbmRHbG9iYWwsXG4gIEZpbmRHbG9iYWxBcmdzLFxuICBGaW5kR2xvYmFsVmVyc2lvbnMsXG4gIEZpbmRHbG9iYWxWZXJzaW9uc0FyZ3MsXG4gIEZpbmRPbmUsXG4gIEZpbmRPbmVBcmdzLFxuICBGaW5kVmVyc2lvbnMsXG4gIEZpbmRWZXJzaW9uc0FyZ3MsXG4gIEluaXQsXG4gIE1pZ3JhdGlvbixcbiAgTWlncmF0aW9uRGF0YSxcbiAgUGFnaW5hdGVkRG9jcyxcbiAgUXVlcnlEcmFmdHMsXG4gIFF1ZXJ5RHJhZnRzQXJncyxcbiAgUm9sbGJhY2tUcmFuc2FjdGlvbixcbiAgVHJhbnNhY3Rpb24sXG4gIFVwZGF0ZUdsb2JhbCxcbiAgVXBkYXRlR2xvYmFsQXJncyxcbiAgVXBkYXRlT25lLFxuICBVcGRhdGVPbmVBcmdzLFxuICBVcGRhdGVWZXJzaW9uLFxuICBVcGRhdGVWZXJzaW9uQXJncyxcbiAgV2VicGFjayxcbn0gZnJvbSAnLi4vZGF0YWJhc2UvdHlwZXMnXG5cbmV4cG9ydCAqIGZyb20gJy4uL2RhdGFiYXNlL3F1ZXJ5VmFsaWRhdGlvbi90eXBlcydcblxuZXhwb3J0IHsgY29tYmluZVF1ZXJpZXMgfSBmcm9tICcuLi9kYXRhYmFzZS9jb21iaW5lUXVlcmllcydcblxuZXhwb3J0IHsgY3JlYXRlRGF0YWJhc2VBZGFwdGVyIH0gZnJvbSAnLi4vZGF0YWJhc2UvY3JlYXRlRGF0YWJhc2VBZGFwdGVyJ1xuXG5leHBvcnQgeyBkZWZhdWx0IGFzIGZsYXR0ZW5XaGVyZVRvT3BlcmF0b3JzIH0gZnJvbSAnLi4vZGF0YWJhc2UvZmxhdHRlbldoZXJlVG9PcGVyYXRvcnMnXG5cbmV4cG9ydCB7IGdldExvY2FsaXplZFBhdGhzIH0gZnJvbSAnLi4vZGF0YWJhc2UvZ2V0TG9jYWxpemVkUGF0aHMnXG5cbmV4cG9ydCB7IGNyZWF0ZU1pZ3JhdGlvbiB9IGZyb20gJy4uL2RhdGFiYXNlL21pZ3JhdGlvbnMvY3JlYXRlTWlncmF0aW9uJ1xuXG5leHBvcnQgeyBnZXRNaWdyYXRpb25zIH0gZnJvbSAnLi4vZGF0YWJhc2UvbWlncmF0aW9ucy9nZXRNaWdyYXRpb25zJ1xuXG5leHBvcnQgeyBtaWdyYXRlIH0gZnJvbSAnLi4vZGF0YWJhc2UvbWlncmF0aW9ucy9taWdyYXRlJ1xuXG5leHBvcnQgeyBtaWdyYXRlRG93biB9IGZyb20gJy4uL2RhdGFiYXNlL21pZ3JhdGlvbnMvbWlncmF0ZURvd24nXG5cbmV4cG9ydCB7IG1pZ3JhdGVSZWZyZXNoIH0gZnJvbSAnLi4vZGF0YWJhc2UvbWlncmF0aW9ucy9taWdyYXRlUmVmcmVzaCdcblxuZXhwb3J0IHsgbWlncmF0ZVJlc2V0IH0gZnJvbSAnLi4vZGF0YWJhc2UvbWlncmF0aW9ucy9taWdyYXRlUmVzZXQnXG5cbmV4cG9ydCB7IG1pZ3JhdGVTdGF0dXMgfSBmcm9tICcuLi9kYXRhYmFzZS9taWdyYXRpb25zL21pZ3JhdGVTdGF0dXMnXG5cbmV4cG9ydCB7IG1pZ3JhdGlvblRlbXBsYXRlIH0gZnJvbSAnLi4vZGF0YWJhc2UvbWlncmF0aW9ucy9taWdyYXRpb25UZW1wbGF0ZSdcblxuZXhwb3J0IHsgbWlncmF0aW9uc0NvbGxlY3Rpb24gfSBmcm9tICcuLi9kYXRhYmFzZS9taWdyYXRpb25zL21pZ3JhdGlvbnNDb2xsZWN0aW9uJ1xuXG5leHBvcnQgeyByZWFkTWlncmF0aW9uRmlsZXMgfSBmcm9tICcuLi9kYXRhYmFzZS9taWdyYXRpb25zL3JlYWRNaWdyYXRpb25GaWxlcydcblxuZXhwb3J0IHsgRW50aXR5UG9saWNpZXMsIFBhdGhUb1F1ZXJ5IH0gZnJvbSAnLi4vZGF0YWJhc2UvcXVlcnlWYWxpZGF0aW9uL3R5cGVzJ1xuXG5leHBvcnQgeyB2YWxpZGF0ZVF1ZXJ5UGF0aHMgfSBmcm9tICcuLi9kYXRhYmFzZS9xdWVyeVZhbGlkYXRpb24vdmFsaWRhdGVRdWVyeVBhdGhzJ1xuXG5leHBvcnQgeyB2YWxpZGF0ZVNlYXJjaFBhcmFtIH0gZnJvbSAnLi4vZGF0YWJhc2UvcXVlcnlWYWxpZGF0aW9uL3ZhbGlkYXRlU2VhcmNoUGFyYW1zJ1xuXG5leHBvcnQgeyB0cmFuc2FjdGlvbiB9IGZyb20gJy4uL2RhdGFiYXNlL3RyYW5zYWN0aW9uJ1xuIl0sIm5hbWVzIjpbIkJlZ2luVHJhbnNhY3Rpb24iLCJDb21taXRUcmFuc2FjdGlvbiIsIkNvbm5lY3QiLCJDcmVhdGUiLCJDcmVhdGVBcmdzIiwiQ3JlYXRlR2xvYmFsIiwiQ3JlYXRlR2xvYmFsQXJncyIsIkNyZWF0ZUdsb2JhbFZlcnNpb24iLCJDcmVhdGVHbG9iYWxWZXJzaW9uQXJncyIsIkNyZWF0ZU1pZ3JhdGlvbiIsIkNyZWF0ZVZlcnNpb24iLCJDcmVhdGVWZXJzaW9uQXJncyIsIkRhdGFiYXNlQWRhcHRlciIsIkRlbGV0ZU1hbnkiLCJEZWxldGVNYW55QXJncyIsIkRlbGV0ZU9uZSIsIkRlbGV0ZU9uZUFyZ3MiLCJEZWxldGVWZXJzaW9ucyIsIkRlbGV0ZVZlcnNpb25zQXJncyIsIkRlc3Ryb3kiLCJGaW5kIiwiRmluZEFyZ3MiLCJGaW5kR2xvYmFsIiwiRmluZEdsb2JhbEFyZ3MiLCJGaW5kR2xvYmFsVmVyc2lvbnMiLCJGaW5kR2xvYmFsVmVyc2lvbnNBcmdzIiwiRmluZE9uZSIsIkZpbmRPbmVBcmdzIiwiRmluZFZlcnNpb25zIiwiRmluZFZlcnNpb25zQXJncyIsIkluaXQiLCJNaWdyYXRpb24iLCJNaWdyYXRpb25EYXRhIiwiUGFnaW5hdGVkRG9jcyIsIlF1ZXJ5RHJhZnRzIiwiUXVlcnlEcmFmdHNBcmdzIiwiUm9sbGJhY2tUcmFuc2FjdGlvbiIsIlRyYW5zYWN0aW9uIiwiVXBkYXRlR2xvYmFsIiwiVXBkYXRlR2xvYmFsQXJncyIsIlVwZGF0ZU9uZSIsIlVwZGF0ZU9uZUFyZ3MiLCJVcGRhdGVWZXJzaW9uIiwiVXBkYXRlVmVyc2lvbkFyZ3MiLCJXZWJwYWNrIiwiY29tYmluZVF1ZXJpZXMiLCJjcmVhdGVEYXRhYmFzZUFkYXB0ZXIiLCJmbGF0dGVuV2hlcmVUb09wZXJhdG9ycyIsImdldExvY2FsaXplZFBhdGhzIiwiY3JlYXRlTWlncmF0aW9uIiwiZ2V0TWlncmF0aW9ucyIsIm1pZ3JhdGUiLCJtaWdyYXRlRG93biIsIm1pZ3JhdGVSZWZyZXNoIiwibWlncmF0ZVJlc2V0IiwibWlncmF0ZVN0YXR1cyIsIm1pZ3JhdGlvblRlbXBsYXRlIiwibWlncmF0aW9uc0NvbGxlY3Rpb24iLCJyZWFkTWlncmF0aW9uRmlsZXMiLCJFbnRpdHlQb2xpY2llcyIsIlBhdGhUb1F1ZXJ5IiwidmFsaWRhdGVRdWVyeVBhdGhzIiwidmFsaWRhdGVTZWFyY2hQYXJhbSIsInRyYW5zYWN0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUNFQSxnQkFBZ0I7ZUFBaEJBLHVCQUFnQjs7SUFDaEJDLGlCQUFpQjtlQUFqQkEsd0JBQWlCOztJQUNqQkMsT0FBTztlQUFQQSxjQUFPOztJQUNQQyxNQUFNO2VBQU5BLGFBQU07O0lBQ05DLFVBQVU7ZUFBVkEsaUJBQVU7O0lBQ1ZDLFlBQVk7ZUFBWkEsbUJBQVk7O0lBQ1pDLGdCQUFnQjtlQUFoQkEsdUJBQWdCOztJQUNo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