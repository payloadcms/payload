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
    extractTranslations: function() {
        return _extractTranslations.extractTranslations;
    },
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
    deepCopyObject: function() {
        return _deepCopyObject.deepCopyObject;
    },
    deepMerge: function() {
        return _deepMerge.deepMerge;
    },
    flattenTopLevelFields: function() {
        return _flattenTopLevelFields.default;
    },
    getTranslation: function() {
        return _getTranslation.getTranslation;
    }
});
const _extractTranslations = require("./dist/translations/extractTranslations");
const _init = require("./dist/translations/init");
const _combineMerge = require("./dist/utilities/combineMerge");
const _configToJSONSchema = require("./dist/utilities/configToJSONSchema");
const _createArrayFromCommaDelineated = require("./dist/utilities/createArrayFromCommaDelineated");
const _deepCopyObject = require("./dist/utilities/deepCopyObject");
const _deepMerge = require("./dist/utilities/deepMerge");
const _flattenTopLevelFields = /*#__PURE__*/ _interop_require_default(require("./dist/utilities/flattenTopLevelFields"));
const _getTranslation = require("./dist/utilities/getTranslation");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHBvcnRzL3V0aWxpdGllcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgeyBleHRyYWN0VHJhbnNsYXRpb25zIH0gZnJvbSAnLi4vdHJhbnNsYXRpb25zL2V4dHJhY3RUcmFuc2xhdGlvbnMnXG5leHBvcnQgeyBpMThuSW5pdCB9IGZyb20gJy4uL3RyYW5zbGF0aW9ucy9pbml0J1xuXG5leHBvcnQgeyBjb21iaW5lTWVyZ2UgfSBmcm9tICcuLi91dGlsaXRpZXMvY29tYmluZU1lcmdlJ1xuZXhwb3J0IHsgY29uZmlnVG9KU09OU2NoZW1hLCBlbnRpdHlUb0pTT05TY2hlbWEgfSBmcm9tICcuLi91dGlsaXRpZXMvY29uZmlnVG9KU09OU2NoZW1hJ1xuZXhwb3J0IHsgY3JlYXRlQXJyYXlGcm9tQ29tbWFEZWxpbmVhdGVkIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2NyZWF0ZUFycmF5RnJvbUNvbW1hRGVsaW5lYXRlZCc7XG5cbmV4cG9ydCB7IGRlZXBDb3B5T2JqZWN0IH0gZnJvbSAnLi4vdXRpbGl0aWVzL2RlZXBDb3B5T2JqZWN0J1xuZXhwb3J0IHsgZGVlcE1lcmdlIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2RlZXBNZXJnZSdcbmV4cG9ydCB7IGRlZmF1bHQgYXMgZmxhdHRlblRvcExldmVsRmllbGRzIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2ZsYXR0ZW5Ub3BMZXZlbEZpZWxkcydcbmV4cG9ydCB7IGdldFRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2dldFRyYW5zbGF0aW9uJ1xuIl0sIm5hbWVzIjpbImV4dHJhY3RUcmFuc2xhdGlvbnMiLCJpMThuSW5pdCIsImNvbWJpbmVNZXJnZSIsImNvbmZpZ1RvSlNPTlNjaGVtYSIsImVudGl0eVRvSlNPTlNjaGVtYSIsImNyZWF0ZUFycmF5RnJvbUNvbW1hRGVsaW5lYXRlZCIsImRlZXBDb3B5T2JqZWN0IiwiZGVlcE1lcmdlIiwiZmxhdHRlblRvcExldmVsRmllbGRzIiwiZ2V0VHJhbnNsYXRpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQVNBLG1CQUFtQjtlQUFuQkEsd0NBQW1COztJQUNuQkMsUUFBUTtlQUFSQSxjQUFROztJQUVSQyxZQUFZO2VBQVpBLDBCQUFZOztJQUNaQyxrQkFBa0I7ZUFBbEJBLHNDQUFrQjs7SUFBRUMsa0JBQWtCO2VBQWxCQSxzQ0FBa0I7O0lBQ3RDQyw4QkFBOEI7ZUFBOUJBLDhEQUE4Qjs7SUFFOUJDLGNBQWM7ZUFBZEEsOEJBQWM7O0lBQ2RDLFNBQVM7ZUFBVEEsb0JBQVM7O0lBQ0VDLHFCQUFxQjtlQUFyQkEsOEJBQXFCOztJQUNoQ0MsY0FBYztlQUFkQSw4QkFBYzs7O3FDQVZhO3NCQUNYOzhCQUVJO29DQUMwQjtnREFDUjtnQ0FFaEI7MkJBQ0w7OEVBQ3VCO2dDQUNsQiJ9