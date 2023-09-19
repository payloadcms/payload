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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHBvcnRzL2RhdGFiYXNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7XG4gIEJlZ2luVHJhbnNhY3Rpb24sXG4gIENvbW1pdFRyYW5zYWN0aW9uLFxuICBDb25uZWN0LFxuICBDcmVhdGUsXG4gIENyZWF0ZUFyZ3MsXG4gIENyZWF0ZUdsb2JhbCxcbiAgQ3JlYXRlR2xvYmFsQXJncyxcbiAgQ3JlYXRlTWlncmF0aW9uLFxuICBDcmVhdGVWZXJzaW9uLFxuICBDcmVhdGVWZXJzaW9uQXJncyxcbiAgRGF0YWJhc2VBZGFwdGVyLFxuICBEZWxldGVNYW55LFxuICBEZWxldGVNYW55QXJncyxcbiAgRGVsZXRlT25lLFxuICBEZWxldGVPbmVBcmdzLFxuICBEZWxldGVWZXJzaW9ucyxcbiAgRGVsZXRlVmVyc2lvbnNBcmdzLFxuICBEZXN0cm95LFxuICBGaW5kLFxuICBGaW5kQXJncyxcbiAgRmluZEdsb2JhbCxcbiAgRmluZEdsb2JhbEFyZ3MsXG4gIEZpbmRHbG9iYWxWZXJzaW9ucyxcbiAgRmluZEdsb2JhbFZlcnNpb25zQXJncyxcbiAgRmluZE9uZSxcbiAgRmluZE9uZUFyZ3MsXG4gIEZpbmRWZXJzaW9ucyxcbiAgRmluZFZlcnNpb25zQXJncyxcbiAgSW5pdCxcbiAgTWlncmF0aW9uLFxuICBNaWdyYXRpb25EYXRhLFxuICBQYWdpbmF0ZWREb2NzLFxuICBRdWVyeURyYWZ0cyxcbiAgUXVlcnlEcmFmdHNBcmdzLFxuICBSb2xsYmFja1RyYW5zYWN0aW9uLFxuICBUcmFuc2FjdGlvbixcbiAgVXBkYXRlR2xvYmFsLFxuICBVcGRhdGVHbG9iYWxBcmdzLFxuICBVcGRhdGVPbmUsXG4gIFVwZGF0ZU9uZUFyZ3MsXG4gIFVwZGF0ZVZlcnNpb24sXG4gIFVwZGF0ZVZlcnNpb25BcmdzLFxuICBXZWJwYWNrLFxufSBmcm9tICcuLi9kYXRhYmFzZS90eXBlcydcblxuZXhwb3J0ICogZnJvbSAnLi4vZGF0YWJhc2UvcXVlcnlWYWxpZGF0aW9uL3R5cGVzJ1xuXG5leHBvcnQgeyBjb21iaW5lUXVlcmllcyB9IGZyb20gJy4uL2RhdGFiYXNlL2NvbWJpbmVRdWVyaWVzJ1xuXG5leHBvcnQgeyBjcmVhdGVEYXRhYmFzZUFkYXB0ZXIgfSBmcm9tICcuLi9kYXRhYmFzZS9jcmVhdGVEYXRhYmFzZUFkYXB0ZXInXG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgZmxhdHRlbldoZXJlVG9PcGVyYXRvcnMgfSBmcm9tICcuLi9kYXRhYmFzZS9mbGF0dGVuV2hlcmVUb09wZXJhdG9ycydcblxuZXhwb3J0IHsgZ2V0TG9jYWxpemVkUGF0aHMgfSBmcm9tICcuLi9kYXRhYmFzZS9nZXRMb2NhbGl6ZWRQYXRocydcblxuZXhwb3J0IHsgY3JlYXRlTWlncmF0aW9uIH0gZnJvbSAnLi4vZGF0YWJhc2UvbWlncmF0aW9ucy9jcmVhdGVNaWdyYXRpb24nXG5cbmV4cG9ydCB7IGdldE1pZ3JhdGlvbnMgfSBmcm9tICcuLi9kYXRhYmFzZS9taWdyYXRpb25zL2dldE1pZ3JhdGlvbnMnXG5cbmV4cG9ydCB7IG1pZ3JhdGUgfSBmcm9tICcuLi9kYXRhYmFzZS9taWdyYXRpb25zL21pZ3JhdGUnXG5cbmV4cG9ydCB7IG1pZ3JhdGVEb3duIH0gZnJvbSAnLi4vZGF0YWJhc2UvbWlncmF0aW9ucy9taWdyYXRlRG93bidcblxuZXhwb3J0IHsgbWlncmF0ZVJlZnJlc2ggfSBmcm9tICcuLi9kYXRhYmFzZS9taWdyYXRpb25zL21pZ3JhdGVSZWZyZXNoJ1xuXG5leHBvcnQgeyBtaWdyYXRlUmVzZXQgfSBmcm9tICcuLi9kYXRhYmFzZS9taWdyYXRpb25zL21pZ3JhdGVSZXNldCdcblxuZXhwb3J0IHsgbWlncmF0ZVN0YXR1cyB9IGZyb20gJy4uL2RhdGFiYXNlL21pZ3JhdGlvbnMvbWlncmF0ZVN0YXR1cydcblxuZXhwb3J0IHsgbWlncmF0aW9uVGVtcGxhdGUgfSBmcm9tICcuLi9kYXRhYmFzZS9taWdyYXRpb25zL21pZ3JhdGlvblRlbXBsYXRlJ1xuXG5leHBvcnQgeyBtaWdyYXRpb25zQ29sbGVjdGlvbiB9IGZyb20gJy4uL2RhdGFiYXNlL21pZ3JhdGlvbnMvbWlncmF0aW9uc0NvbGxlY3Rpb24nXG5cbmV4cG9ydCB7IHJlYWRNaWdyYXRpb25GaWxlcyB9IGZyb20gJy4uL2RhdGFiYXNlL21pZ3JhdGlvbnMvcmVhZE1pZ3JhdGlvbkZpbGVzJ1xuXG5leHBvcnQgeyBFbnRpdHlQb2xpY2llcywgUGF0aFRvUXVlcnkgfSBmcm9tICcuLi9kYXRhYmFzZS9xdWVyeVZhbGlkYXRpb24vdHlwZXMnXG5cbmV4cG9ydCB7IHZhbGlkYXRlUXVlcnlQYXRocyB9IGZyb20gJy4uL2RhdGFiYXNlL3F1ZXJ5VmFsaWRhdGlvbi92YWxpZGF0ZVF1ZXJ5UGF0aHMnXG5cbmV4cG9ydCB7IHZhbGlkYXRlU2VhcmNoUGFyYW0gfSBmcm9tICcuLi9kYXRhYmFzZS9xdWVyeVZhbGlkYXRpb24vdmFsaWRhdGVTZWFyY2hQYXJhbXMnXG5cbmV4cG9ydCB7IHRyYW5zYWN0aW9uIH0gZnJvbSAnLi4vZGF0YWJhc2UvdHJhbnNhY3Rpb24nXG4iXSwibmFtZXMiOlsiQmVnaW5UcmFuc2FjdGlvbiIsIkNvbW1pdFRyYW5zYWN0aW9uIiwiQ29ubmVjdCIsIkNyZWF0ZSIsIkNyZWF0ZUFyZ3MiLCJDcmVhdGVHbG9iYWwiLCJDcmVhdGVHbG9iYWxBcmdzIiwiQ3JlYXRlTWlncmF0aW9uIiwiQ3JlYXRlVmVyc2lvbiIsIkNyZWF0ZVZlcnNpb25BcmdzIiwiRGF0YWJhc2VBZGFwdGVyIiwiRGVsZXRlTWFueSIsIkRlbGV0ZU1hbnlBcmdzIiwiRGVsZXRlT25lIiwiRGVsZXRlT25lQXJncyIsIkRlbGV0ZVZlcnNpb25zIiwiRGVsZXRlVmVyc2lvbnNBcmdzIiwiRGVzdHJveSIsIkZpbmQiLCJGaW5kQXJncyIsIkZpbmRHbG9iYWwiLCJGaW5kR2xvYmFsQXJncyIsIkZpbmRHbG9iYWxWZXJzaW9ucyIsIkZpbmRHbG9iYWxWZXJzaW9uc0FyZ3MiLCJGaW5kT25lIiwiRmluZE9uZUFyZ3MiLCJGaW5kVmVyc2lvbnMiLCJGaW5kVmVyc2lvbnNBcmdzIiwiSW5pdCIsIk1pZ3JhdGlvbiIsIk1pZ3JhdGlvbkRhdGEiLCJQYWdpbmF0ZWREb2NzIiwiUXVlcnlEcmFmdHMiLCJRdWVyeURyYWZ0c0FyZ3MiLCJSb2xsYmFja1RyYW5zYWN0aW9uIiwiVHJhbnNhY3Rpb24iLCJVcGRhdGVHbG9iYWwiLCJVcGRhdGVHbG9iYWxBcmdzIiwiVXBkYXRlT25lIiwiVXBkYXRlT25lQXJncyIsIlVwZGF0ZVZlcnNpb24iLCJVcGRhdGVWZXJzaW9uQXJncyIsIldlYnBhY2siLCJjb21iaW5lUXVlcmllcyIsImNyZWF0ZURhdGFiYXNlQWRhcHRlciIsImZsYXR0ZW5XaGVyZVRvT3BlcmF0b3JzIiwiZ2V0TG9jYWxpemVkUGF0aHMiLCJjcmVhdGVNaWdyYXRpb24iLCJnZXRNaWdyYXRpb25zIiwibWlncmF0ZSIsIm1pZ3JhdGVEb3duIiwibWlncmF0ZVJlZnJlc2giLCJtaWdyYXRlUmVzZXQiLCJtaWdyYXRlU3RhdHVzIiwibWlncmF0aW9uVGVtcGxhdGUiLCJtaWdyYXRpb25zQ29sbGVjdGlvbiIsInJlYWRNaWdyYXRpb25GaWxlcyIsIkVudGl0eVBvbGljaWVzIiwiUGF0aFRvUXVlcnkiLCJ2YWxpZGF0ZVF1ZXJ5UGF0aHMiLCJ2YWxpZGF0ZVNlYXJjaFBhcmFtIiwidHJhbnNhY3Rpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQ0VBLGdCQUFnQjtlQUFoQkEsdUJBQWdCOztJQUNoQkMsaUJBQWlCO2VBQWpCQSx3QkFBaUI7O0lBQ2pCQyxPQUFPO2VBQVBBLGNBQU87O0lBQ1BDLE1BQU07ZUFBTkEsYUFBTTs7SUFDTkMsVUFBVTtlQUFWQSxpQkFBVTs7SUFDVkMsWUFBWTtlQUFaQSxtQkFBWTs7SUFDWkMsZ0JBQWdCO2VBQWhCQSx1QkFBZ0I7O0lBQ2hCQyxlQUFlO2VBQWZBLHNCQUFlOztJQUNmQyxhQUFhO2VBQWJBLG9CQUFhOztJQUNiQyxpQkFBaUI7ZUFBakJBLHdCQUFpQjs7SUFDakJDLGVBQWU7ZUFBZkEsc0JBQWU7O0lBQ2ZDLFVBQVU7ZUFBVkEsaUJBQVU7O0lBQ1ZDLGNBQWM7ZUFBZEEscUJBQWM7O0lBQ2RDLFNBQVM7ZUFBVEEsZ0JBQVM7O0lBQ1RDLGFBQWE7ZUFBYkEsb0JBQWE7O0lBQ2JDLGNBQWM7ZUFBZEEscUJBQWM7O0lBQ2RDLGtCQUFrQjtlQUFsQkEseUJBQWtCOztJQUNsQkMsT0FBTztlQUFQQSxjQUFPOztJQUNQQyxJQUFJO2VBQUpBLFdBQUk7O0lBQ0pDLFFBQVE7ZUFBUkEsZUFBUTs7SUFDUkMsVUFBVTtlQUFWQSxpQkFBVTs7SUFDVkMsY0FBYztlQUFkQSxxQkFBYzs7SUFDZEMsa0JBQWtCO2VBQWxCQSx5QkFBa0I7O0lBQ2xCQyxzQkFBc0I7ZUFBdEJBLDZCQUFzQjs7SUFDdEJDLE9BQU87ZUFBUEEsY0FBTzs7SUFDUEMsV0FBVztlQUFYQSxrQkFBVzs7SUFDWEMsWUFBWTtlQUFaQSxtQkFBWTs7SUFDWkMsZ0JBQWdCO2VBQWhCQSx1QkFBZ0I7O0lBQ2hCQyxJQUFJO2VBQUpBLFdBQUk7O0lBQ0pDLFNBQVM7ZUFBVEEsZ0JBQVM7O0lBQ1RDLGFBQWE7ZUFBYkEsb0JBQWE7O0lBQ2JDLGFBQWE7ZUFBYkEsb0JBQWE7O0lBQ2JDLFdBQVc7ZUFBWEEsa0JBQVc7O0lBQ1hDLGVBQWU7ZUFBZkEsc0JBQWU7O0lBQ2ZDLG1CQUFtQjtlQUFuQkEsMEJBQW1COztJQUNuQkMsV0FBVztlQUFYQSxrQkFBVzs7SUFDWEMsWUFBWTtlQUFaQSxtQkFBWTs7SUFDWkMsZ0JBQWdCO2VBQWhCQSx1QkFBZ0I7O0lBQ2hCQyxTQUFTO2VBQVRBLGdCQUFTOztJQUNUQyxhQUFhO2VBQWJBLG9CQUFhOztJQUNiQyxhQUFhO2VBQWJBLG9CQUFhOztJQUNiQyxpQkFBaUI7ZUFBakJBLHdCQUFpQjs7SUFDakJDLE9BQU87ZUFBUEEsY0FBTzs7SUFLQUMsY0FBYztlQUFkQSw4QkFBYzs7SUFFZEMscUJBQXFCO2VBQXJCQSw0Q0FBcUI7O0lBRVZDLHVCQUF1QjtlQUF2QkEsZ0NBQXVCOztJQUVsQ0MsaUJBQWlCO2VBQWpCQSxvQ0FBaUI7O0lBRWpCQyxlQUFlO2VBQWZBLGdDQUFlOztJQUVmQyxhQUFhO2VBQWJBLDRCQUFhOztJQUViQyxPQUFPO2VBQVBBLGdCQUFPOztJQUVQQyxXQUFXO2VBQVhBLHdCQUFXOztJQUVYQyxjQUFjO2VBQWRBLDhCQUFjOztJQUVkQyxZQUFZO2VBQVpBLDBCQUFZOztJQUVaQyxhQUFhO2VBQWJBLDRCQUFhOztJQUViQyxpQkFBaUI7ZUFBakJBLG9DQUFpQjs7SUFFakJDLG9CQUFvQjtlQUFwQkEsMENBQW9COztJQUVwQkMsa0JBQWtCO2VBQWxCQSxzQ0FBa0I7O0lBRWxCQyxjQUFjO2VBQWRBLHNCQUFjOztJQUFFQyxXQUFXO2VBQVhBLG1CQUFXOztJQUUzQkMsa0JBQWtCO2VBQWxCQSxzQ0FBa0I7O0lBRWxCQyxtQkFBbUI7ZUFBbkJBLHlDQUFtQjs7SUFFbkJDLFdBQVc7ZUFBWEEsd0JBQVc7Ozt1QkF0Q2I7cUNBRU87Z0NBRWlCO3VDQUVPO2dGQUVhO21DQUVqQjtpQ0FFRjsrQkFFRjt5QkFFTjs2QkFFSTtnQ0FFRzs4QkFFRjsrQkFFQzttQ0FFSTtzQ0FFRztvQ0FFRjtvQ0FJQTtzQ0FFQzs2QkFFUiJ9