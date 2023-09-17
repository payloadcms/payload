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
    buildVersionCollectionFields: function() {
        return _buildCollectionFields.buildVersionCollectionFields;
    },
    buildVersionGlobalFields: function() {
        return _buildGlobalFields.buildVersionGlobalFields;
    },
    deleteCollectionVersions: function() {
        return _deleteCollectionVersions.deleteCollectionVersions;
    },
    enforceMaxVersions: function() {
        return _enforceMaxVersions.enforceMaxVersions;
    },
    getLatestCollectionVersion: function() {
        return _getLatestCollectionVersion.getLatestCollectionVersion;
    },
    getLatestGlobalVersion: function() {
        return _getLatestGlobalVersion.getLatestGlobalVersion;
    },
    getVersionsModelName: function() {
        return _getVersionsModelName.getVersionsModelName;
    },
    saveVersion: function() {
        return _saveVersion.saveVersion;
    }
});
const _buildCollectionFields = require("./dist/versions/buildCollectionFields");
const _buildGlobalFields = require("./dist/versions/buildGlobalFields");
const _deleteCollectionVersions = require("./dist/versions/deleteCollectionVersions");
const _enforceMaxVersions = require("./dist/versions/enforceMaxVersions");
const _getLatestCollectionVersion = require("./dist/versions/getLatestCollectionVersion");
const _getLatestGlobalVersion = require("./dist/versions/getLatestGlobalVersion");
const _getVersionsModelName = require("./dist/versions/getVersionsModelName");
const _saveVersion = require("./dist/versions/saveVersion");

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHBvcnRzL3ZlcnNpb25zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7IGJ1aWxkVmVyc2lvbkNvbGxlY3Rpb25GaWVsZHMgfSBmcm9tICcuLi92ZXJzaW9ucy9idWlsZENvbGxlY3Rpb25GaWVsZHMnXG5leHBvcnQgeyBidWlsZFZlcnNpb25HbG9iYWxGaWVsZHMgfSBmcm9tICcuLi92ZXJzaW9ucy9idWlsZEdsb2JhbEZpZWxkcydcbmV4cG9ydCB7IGRlbGV0ZUNvbGxlY3Rpb25WZXJzaW9ucyB9IGZyb20gJy4uL3ZlcnNpb25zL2RlbGV0ZUNvbGxlY3Rpb25WZXJzaW9ucydcbmV4cG9ydCB7IGVuZm9yY2VNYXhWZXJzaW9ucyB9IGZyb20gJy4uL3ZlcnNpb25zL2VuZm9yY2VNYXhWZXJzaW9ucydcbmV4cG9ydCB7IGdldExhdGVzdENvbGxlY3Rpb25WZXJzaW9uIH0gZnJvbSAnLi4vdmVyc2lvbnMvZ2V0TGF0ZXN0Q29sbGVjdGlvblZlcnNpb24nXG5leHBvcnQgeyBnZXRMYXRlc3RHbG9iYWxWZXJzaW9uIH0gZnJvbSAnLi4vdmVyc2lvbnMvZ2V0TGF0ZXN0R2xvYmFsVmVyc2lvbidcbmV4cG9ydCB7IGdldFZlcnNpb25zTW9kZWxOYW1lIH0gZnJvbSAnLi4vdmVyc2lvbnMvZ2V0VmVyc2lvbnNNb2RlbE5hbWUnXG5leHBvcnQgeyBzYXZlVmVyc2lvbiB9IGZyb20gJy4uL3ZlcnNpb25zL3NhdmVWZXJzaW9uJ1xuIl0sIm5hbWVzIjpbImJ1aWxkVmVyc2lvbkNvbGxlY3Rpb25GaWVsZHMiLCJidWlsZFZlcnNpb25HbG9iYWxGaWVsZHMiLCJkZWxldGVDb2xsZWN0aW9uVmVyc2lvbnMiLCJlbmZvcmNlTWF4VmVyc2lvbnMiLCJnZXRMYXRlc3RDb2xsZWN0aW9uVmVyc2lvbiIsImdldExhdGVzdEdsb2JhbFZlcnNpb24iLCJnZXRWZXJzaW9uc01vZGVsTmFtZSIsInNhdmVWZXJzaW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFTQSw0QkFBNEI7ZUFBNUJBLG1EQUE0Qjs7SUFDNUJDLHdCQUF3QjtlQUF4QkEsMkNBQXdCOztJQUN4QkMsd0JBQXdCO2VBQXhCQSxrREFBd0I7O0lBQ3hCQyxrQkFBa0I7ZUFBbEJBLHNDQUFrQjs7SUFDbEJDLDBCQUEwQjtlQUExQkEsc0RBQTBCOztJQUMxQkMsc0JBQXNCO2VBQXRCQSw4Q0FBc0I7O0lBQ3RCQyxvQkFBb0I7ZUFBcEJBLDBDQUFvQjs7SUFDcEJDLFdBQVc7ZUFBWEEsd0JBQVc7Ozt1Q0FQeUI7bUNBQ0o7MENBQ0E7b0NBQ047NENBQ1E7d0NBQ0o7c0NBQ0Y7NkJBQ1QifQ==