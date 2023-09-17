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
    i18nInit: function() {
        return _init.i18nInit;
    },
    combineMerge: function() {
        return _combineMerge.combineMerge;
    },
    configToJSONSchema: function() {
        return _configToJSONSchema.configToJSONSchema;
    },
    entityToJSONSchema: function() {
        return _configToJSONSchema.entityToJSONSchema;
    },
    createArrayFromCommaDelineated: function() {
        return _createArrayFromCommaDelineated.createArrayFromCommaDelineated;
    },
    flattenTopLevelFields: function() {
        return _flattenTopLevelFields.default;
    }
});
const _init = require("./dist/translations/init");
const _combineMerge = require("./dist/utilities/combineMerge");
const _configToJSONSchema = require("./dist/utilities/configToJSONSchema");
const _createArrayFromCommaDelineated = require("./dist/utilities/createArrayFromCommaDelineated");
const _flattenTopLevelFields = /*#__PURE__*/ _interop_require_default(require("./dist/utilities/flattenTopLevelFields"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHBvcnRzL3V0aWxpdGllcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgeyBpMThuSW5pdCB9IGZyb20gJy4uL3RyYW5zbGF0aW9ucy9pbml0J1xuXG5leHBvcnQgeyBjb21iaW5lTWVyZ2UgfSBmcm9tICcuLi91dGlsaXRpZXMvY29tYmluZU1lcmdlJ1xuZXhwb3J0IHsgY29uZmlnVG9KU09OU2NoZW1hLCBlbnRpdHlUb0pTT05TY2hlbWEgfSBmcm9tICcuLi91dGlsaXRpZXMvY29uZmlnVG9KU09OU2NoZW1hJ1xuZXhwb3J0IHsgY3JlYXRlQXJyYXlGcm9tQ29tbWFEZWxpbmVhdGVkIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2NyZWF0ZUFycmF5RnJvbUNvbW1hRGVsaW5lYXRlZCc7XG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgZmxhdHRlblRvcExldmVsRmllbGRzIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2ZsYXR0ZW5Ub3BMZXZlbEZpZWxkcydcbiJdLCJuYW1lcyI6WyJpMThuSW5pdCIsImNvbWJpbmVNZXJnZSIsImNvbmZpZ1RvSlNPTlNjaGVtYSIsImVudGl0eVRvSlNPTlNjaGVtYSIsImNyZWF0ZUFycmF5RnJvbUNvbW1hRGVsaW5lYXRlZCIsImZsYXR0ZW5Ub3BMZXZlbEZpZWxkcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBU0EsUUFBUTtlQUFSQSxjQUFROztJQUVSQyxZQUFZO2VBQVpBLDBCQUFZOztJQUNaQyxrQkFBa0I7ZUFBbEJBLHNDQUFrQjs7SUFBRUMsa0JBQWtCO2VBQWxCQSxzQ0FBa0I7O0lBQ3RDQyw4QkFBOEI7ZUFBOUJBLDhEQUE4Qjs7SUFFbkJDLHFCQUFxQjtlQUFyQkEsOEJBQXFCOzs7c0JBTmhCOzhCQUVJO29DQUMwQjtnREFDUjs4RUFFRSJ9