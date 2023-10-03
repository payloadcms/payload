'use strict'
Object.defineProperty(exports, '__esModule', {
  value: true,
})
function _export(target, all) {
  for (var name in all)
    Object.defineProperty(target, name, {
      enumerable: true,
      get: all[name],
    })
}
_export(exports, {
  BaseDatabaseAdapter: function () {
    return _types.BaseDatabaseAdapter
  },
  BeginTransaction: function () {
    return _types.BeginTransaction
  },
  CommitTransaction: function () {
    return _types.CommitTransaction
  },
  Connect: function () {
    return _types.Connect
  },
  Create: function () {
    return _types.Create
  },
  CreateArgs: function () {
    return _types.CreateArgs
  },
  CreateGlobal: function () {
    return _types.CreateGlobal
  },
  CreateGlobalArgs: function () {
    return _types.CreateGlobalArgs
  },
  CreateGlobalVersion: function () {
    return _types.CreateGlobalVersion
  },
  CreateGlobalVersionArgs: function () {
    return _types.CreateGlobalVersionArgs
  },
  CreateMigration: function () {
    return _types.CreateMigration
  },
  CreateVersion: function () {
    return _types.CreateVersion
  },
  CreateVersionArgs: function () {
    return _types.CreateVersionArgs
  },
  DeleteMany: function () {
    return _types.DeleteMany
  },
  DeleteManyArgs: function () {
    return _types.DeleteManyArgs
  },
  DeleteOne: function () {
    return _types.DeleteOne
  },
  DeleteOneArgs: function () {
    return _types.DeleteOneArgs
  },
  DeleteVersions: function () {
    return _types.DeleteVersions
  },
  DeleteVersionsArgs: function () {
    return _types.DeleteVersionsArgs
  },
  Destroy: function () {
    return _types.Destroy
  },
  Find: function () {
    return _types.Find
  },
  FindArgs: function () {
    return _types.FindArgs
  },
  FindGlobal: function () {
    return _types.FindGlobal
  },
  FindGlobalArgs: function () {
    return _types.FindGlobalArgs
  },
  FindGlobalVersions: function () {
    return _types.FindGlobalVersions
  },
  FindGlobalVersionsArgs: function () {
    return _types.FindGlobalVersionsArgs
  },
  FindOne: function () {
    return _types.FindOne
  },
  FindOneArgs: function () {
    return _types.FindOneArgs
  },
  FindVersions: function () {
    return _types.FindVersions
  },
  FindVersionsArgs: function () {
    return _types.FindVersionsArgs
  },
  Init: function () {
    return _types.Init
  },
  Migration: function () {
    return _types.Migration
  },
  MigrationData: function () {
    return _types.MigrationData
  },
  PaginatedDocs: function () {
    return _types.PaginatedDocs
  },
  QueryDrafts: function () {
    return _types.QueryDrafts
  },
  QueryDraftsArgs: function () {
    return _types.QueryDraftsArgs
  },
  RollbackTransaction: function () {
    return _types.RollbackTransaction
  },
  Transaction: function () {
    return _types.Transaction
  },
  TypeWithVersion: function () {
    return _types.TypeWithVersion
  },
  UpdateGlobal: function () {
    return _types.UpdateGlobal
  },
  UpdateGlobalArgs: function () {
    return _types.UpdateGlobalArgs
  },
  UpdateGlobalVersion: function () {
    return _types.UpdateGlobalVersion
  },
  UpdateGlobalVersionArgs: function () {
    return _types.UpdateGlobalVersionArgs
  },
  UpdateOne: function () {
    return _types.UpdateOne
  },
  UpdateOneArgs: function () {
    return _types.UpdateOneArgs
  },
  UpdateVersion: function () {
    return _types.UpdateVersion
  },
  UpdateVersionArgs: function () {
    return _types.UpdateVersionArgs
  },
  Webpack: function () {
    return _types.Webpack
  },
  combineQueries: function () {
    return _combineQueries.combineQueries
  },
  createDatabaseAdapter: function () {
    return _createDatabaseAdapter.createDatabaseAdapter
  },
  flattenWhereToOperators: function () {
    return _flattenWhereToOperators.default
  },
  getLocalizedPaths: function () {
    return _getLocalizedPaths.getLocalizedPaths
  },
  createMigration: function () {
    return _createMigration.createMigration
  },
  getMigrations: function () {
    return _getMigrations.getMigrations
  },
  migrate: function () {
    return _migrate.migrate
  },
  migrateDown: function () {
    return _migrateDown.migrateDown
  },
  migrateRefresh: function () {
    return _migrateRefresh.migrateRefresh
  },
  migrateReset: function () {
    return _migrateReset.migrateReset
  },
  migrateStatus: function () {
    return _migrateStatus.migrateStatus
  },
  migrationTemplate: function () {
    return _migrationTemplate.migrationTemplate
  },
  migrationsCollection: function () {
    return _migrationsCollection.migrationsCollection
  },
  readMigrationFiles: function () {
    return _readMigrationFiles.readMigrationFiles
  },
  EntityPolicies: function () {
    return _types1.EntityPolicies
  },
  PathToQuery: function () {
    return _types1.PathToQuery
  },
  validateQueryPaths: function () {
    return _validateQueryPaths.validateQueryPaths
  },
  validateSearchParam: function () {
    return _validateSearchParams.validateSearchParam
  },
  transaction: function () {
    return _transaction.transaction
  },
})
const _types = require('./dist/database/types')
const _types1 = _export_star(require('./dist/database/queryValidation/types'), exports)
const _combineQueries = require('./dist/database/combineQueries')
const _createDatabaseAdapter = require('./dist/database/createDatabaseAdapter')
const _flattenWhereToOperators = /*#__PURE__*/ _interop_require_default(
  require('./dist/database/flattenWhereToOperators'),
)
const _getLocalizedPaths = require('./dist/database/getLocalizedPaths')
const _createMigration = require('./dist/database/migrations/createMigration')
const _getMigrations = require('./dist/database/migrations/getMigrations')
const _migrate = require('./dist/database/migrations/migrate')
const _migrateDown = require('./dist/database/migrations/migrateDown')
const _migrateRefresh = require('./dist/database/migrations/migrateRefresh')
const _migrateReset = require('./dist/database/migrations/migrateReset')
const _migrateStatus = require('./dist/database/migrations/migrateStatus')
const _migrationTemplate = require('./dist/database/migrations/migrationTemplate')
const _migrationsCollection = require('./dist/database/migrations/migrationsCollection')
const _readMigrationFiles = require('./dist/database/migrations/readMigrationFiles')
const _validateQueryPaths = require('./dist/database/queryValidation/validateQueryPaths')
const _validateSearchParams = require('./dist/database/queryValidation/validateSearchParams')
const _transaction = require('./dist/database/transaction')
function _export_star(from, to) {
  Object.keys(from).forEach(function (k) {
    if (k !== 'default' && !Object.prototype.hasOwnProperty.call(to, k)) {
      Object.defineProperty(to, k, {
        enumerable: true,
        get: function () {
          return from[k]
        },
      })
    }
  })
  return from
}
function _interop_require_default(obj) {
  return obj && obj.__esModule
    ? obj
    : {
        default: obj,
      }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHBvcnRzL2RhdGFiYXNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7XG4gIEJhc2VEYXRhYmFzZUFkYXB0ZXIsXG4gIEJlZ2luVHJhbnNhY3Rpb24sXG4gIENvbW1pdFRyYW5zYWN0aW9uLFxuICBDb25uZWN0LFxuICBDcmVhdGUsXG4gIENyZWF0ZUFyZ3MsXG4gIENyZWF0ZUdsb2JhbCxcbiAgQ3JlYXRlR2xvYmFsQXJncyxcbiAgQ3JlYXRlR2xvYmFsVmVyc2lvbixcbiAgQ3JlYXRlR2xvYmFsVmVyc2lvbkFyZ3MsXG4gIENyZWF0ZU1pZ3JhdGlvbixcbiAgQ3JlYXRlVmVyc2lvbixcbiAgQ3JlYXRlVmVyc2lvbkFyZ3MsXG4gIERlbGV0ZU1hbnksXG4gIERlbGV0ZU1hbnlBcmdzLFxuICBEZWxldGVPbmUsXG4gIERlbGV0ZU9uZUFyZ3MsXG4gIERlbGV0ZVZlcnNpb25zLFxuICBEZWxldGVWZXJzaW9uc0FyZ3MsXG4gIERlc3Ryb3ksXG4gIEZpbmQsXG4gIEZpbmRBcmdzLFxuICBGaW5kR2xvYmFsLFxuICBGaW5kR2xvYmFsQXJncyxcbiAgRmluZEdsb2JhbFZlcnNpb25zLFxuICBGaW5kR2xvYmFsVmVyc2lvbnNBcmdzLFxuICBGaW5kT25lLFxuICBGaW5kT25lQXJncyxcbiAgRmluZFZlcnNpb25zLFxuICBGaW5kVmVyc2lvbnNBcmdzLFxuICBJbml0LFxuICBNaWdyYXRpb24sXG4gIE1pZ3JhdGlvbkRhdGEsXG4gIFBhZ2luYXRlZERvY3MsXG4gIFF1ZXJ5RHJhZnRzLFxuICBRdWVyeURyYWZ0c0FyZ3MsXG4gIFJvbGxiYWNrVHJhbnNhY3Rpb24sXG4gIFRyYW5zYWN0aW9uLFxuICBUeXBlV2l0aFZlcnNpb24sXG4gIFVwZGF0ZUdsb2JhbCxcbiAgVXBkYXRlR2xvYmFsQXJncyxcbiAgVXBkYXRlR2xvYmFsVmVyc2lvbixcbiAgVXBkYXRlR2xvYmFsVmVyc2lvbkFyZ3MsXG4gIFVwZGF0ZU9uZSxcbiAgVXBkYXRlT25lQXJncyxcbiAgVXBkYXRlVmVyc2lvbixcbiAgVXBkYXRlVmVyc2lvbkFyZ3MsXG4gIFdlYnBhY2ssXG59IGZyb20gJy4uL2RhdGFiYXNlL3R5cGVzJ1xuXG5leHBvcnQgKiBmcm9tICcuLi9kYXRhYmFzZS9xdWVyeVZhbGlkYXRpb24vdHlwZXMnXG5cbmV4cG9ydCB7IGNvbWJpbmVRdWVyaWVzIH0gZnJvbSAnLi4vZGF0YWJhc2UvY29tYmluZVF1ZXJpZXMnXG5cbmV4cG9ydCB7IGNyZWF0ZURhdGFiYXNlQWRhcHRlciB9IGZyb20gJy4uL2RhdGFiYXNlL2NyZWF0ZURhdGFiYXNlQWRhcHRlcidcblxuZXhwb3J0IHsgZGVmYXVsdCBhcyBmbGF0dGVuV2hlcmVUb09wZXJhdG9ycyB9IGZyb20gJy4uL2RhdGFiYXNlL2ZsYXR0ZW5XaGVyZVRvT3BlcmF0b3JzJ1xuXG5leHBvcnQgeyBnZXRMb2NhbGl6ZWRQYXRocyB9IGZyb20gJy4uL2RhdGFiYXNlL2dldExvY2FsaXplZFBhdGhzJ1xuXG5leHBvcnQgeyBjcmVhdGVNaWdyYXRpb24gfSBmcm9tICcuLi9kYXRhYmFzZS9taWdyYXRpb25zL2NyZWF0ZU1pZ3JhdGlvbidcblxuZXhwb3J0IHsgZ2V0TWlncmF0aW9ucyB9IGZyb20gJy4uL2RhdGFiYXNlL21pZ3JhdGlvbnMvZ2V0TWlncmF0aW9ucydcblxuZXhwb3J0IHsgbWlncmF0ZSB9IGZyb20gJy4uL2RhdGFiYXNlL21pZ3JhdGlvbnMvbWlncmF0ZSdcblxuZXhwb3J0IHsgbWlncmF0ZURvd24gfSBmcm9tICcuLi9kYXRhYmFzZS9taWdyYXRpb25zL21pZ3JhdGVEb3duJ1xuXG5leHBvcnQgeyBtaWdyYXRlUmVmcmVzaCB9IGZyb20gJy4uL2RhdGFiYXNlL21pZ3JhdGlvbnMvbWlncmF0ZVJlZnJlc2gnXG5cbmV4cG9ydCB7IG1pZ3JhdGVSZXNldCB9IGZyb20gJy4uL2RhdGFiYXNlL21pZ3JhdGlvbnMvbWlncmF0ZVJlc2V0J1xuXG5leHBvcnQgeyBtaWdyYXRlU3RhdHVzIH0gZnJvbSAnLi4vZGF0YWJhc2UvbWlncmF0aW9ucy9taWdyYXRlU3RhdHVzJ1xuXG5leHBvcnQgeyBtaWdyYXRpb25UZW1wbGF0ZSB9IGZyb20gJy4uL2RhdGFiYXNlL21pZ3JhdGlvbnMvbWlncmF0aW9uVGVtcGxhdGUnXG5cbmV4cG9ydCB7IG1pZ3JhdGlvbnNDb2xsZWN0aW9uIH0gZnJvbSAnLi4vZGF0YWJhc2UvbWlncmF0aW9ucy9taWdyYXRpb25zQ29sbGVjdGlvbidcblxuZXhwb3J0IHsgcmVhZE1pZ3JhdGlvbkZpbGVzIH0gZnJvbSAnLi4vZGF0YWJhc2UvbWlncmF0aW9ucy9yZWFkTWlncmF0aW9uRmlsZXMnXG5cbmV4cG9ydCB7IEVudGl0eVBvbGljaWVzLCBQYXRoVG9RdWVyeSB9IGZyb20gJy4uL2RhdGFiYXNlL3F1ZXJ5VmFsaWRhdGlvbi90eXBlcydcblxuZXhwb3J0IHsgdmFsaWRhdGVRdWVyeVBhdGhzIH0gZnJvbSAnLi4vZGF0YWJhc2UvcXVlcnlWYWxpZGF0aW9uL3ZhbGlkYXRlUXVlcnlQYXRocydcblxuZXhwb3J0IHsgdmFsaWRhdGVTZWFyY2hQYXJhbSB9IGZyb20gJy4uL2RhdGFiYXNlL3F1ZXJ5VmFsaWRhdGlvbi92YWxpZGF0ZVNlYXJjaFBhcmFtcydcblxuZXhwb3J0IHsgdHJhbnNhY3Rpb24gfSBmcm9tICcuLi9kYXRhYmFzZS90cmFuc2FjdGlvbidcbiJdLCJuYW1lcyI6WyJCYXNlRGF0YWJhc2VBZGFwdGVyIiwiQmVnaW5UcmFuc2FjdGlvbiIsIkNvbW1pdFRyYW5zYWN0aW9uIiwiQ29ubmVjdCIsIkNyZWF0ZSIsIkNyZWF0ZUFyZ3MiLCJDcmVhdGVHbG9iYWwiLCJDcmVhdGVHbG9iYWxBcmdzIiwiQ3JlYXRlR2xvYmFsVmVyc2lvbiIsIkNyZWF0ZUdsb2JhbFZlcnNpb25BcmdzIiwiQ3JlYXRlTWlncmF0aW9uIiwiQ3JlYXRlVmVyc2lvbiIsIkNyZWF0ZVZlcnNpb25BcmdzIiwiRGVsZXRlTWFueSIsIkRlbGV0ZU1hbnlBcmdzIiwiRGVsZXRlT25lIiwiRGVsZXRlT25lQXJncyIsIkRlbGV0ZVZlcnNpb25zIiwiRGVsZXRlVmVyc2lvbnNBcmdzIiwiRGVzdHJveSIsIkZpbmQiLCJGaW5kQXJncyIsIkZpbmRHbG9iYWwiLCJGaW5kR2xvYmFsQXJncyIsIkZpbmRHbG9iYWxWZXJzaW9ucyIsIkZpbmRHbG9iYWxWZXJzaW9uc0FyZ3MiLCJGaW5kT25lIiwiRmluZE9uZUFyZ3MiLCJGaW5kVmVyc2lvbnMiLCJGaW5kVmVyc2lvbnNBcmdzIiwiSW5pdCIsIk1pZ3JhdGlvbiIsIk1pZ3JhdGlvbkRhdGEiLCJQYWdpbmF0ZWREb2NzIiwiUXVlcnlEcmFmdHMiLCJRdWVyeURyYWZ0c0FyZ3MiLCJSb2xsYmFja1RyYW5zYWN0aW9uIiwiVHJhbnNhY3Rpb24iLCJUeXBlV2l0aFZlcnNpb24iLCJVcGRhdGVHbG9iYWwiLCJVcGRhdGVHbG9iYWxBcmdzIiwiVXBkYXRlR2xvYmFsVmVyc2lvbiIsIlVwZGF0ZUdsb2JhbFZlcnNpb25BcmdzIiwiVXBkYXRlT25lIiwiVXBkYXRlT25lQXJncyIsIlVwZGF0ZVZlcnNpb24iLCJVcGRhdGVWZXJzaW9uQXJncyIsIldlYnBhY2siLCJjb21iaW5lUXVlcmllcyIsImNyZWF0ZURhdGFiYXNlQWRhcHRlciIsImZsYXR0ZW5XaGVyZVRvT3BlcmF0b3JzIiwiZ2V0TG9jYWxpemVkUGF0aHMiLCJjcmVhdGVNaWdyYXRpb24iLCJnZXRNaWdyYXRpb25zIiwibWlncmF0ZSIsIm1pZ3JhdGVEb3duIiwibWlncmF0ZVJlZnJlc2giLCJtaWdyYXRlUmVzZXQiLCJtaWdyYXRlU3RhdHVzIiwibWlncmF0aW9uVGVtcGxhdGUiLCJtaWdyYXRpb25zQ29sbGVjdGlvbiIsInJlYWRNaWdyYXRpb25GaWxlcyIsIkVudGl0eVBvbGljaWVzIiwiUGF0aFRvUXVlcnkiLCJ2YWxpZGF0ZVF1ZXJ5UGF0aHMiLCJ2YWxpZGF0ZVNlYXJjaFBhcmFtIiwidHJhbnNhY3Rpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQ0VBLG1CQUFtQjtlQUFuQkEsMEJBQW1COztJQUNuQkMsZ0JB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
