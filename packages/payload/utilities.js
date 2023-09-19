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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHBvcnRzL3V0aWxpdGllcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgeyBleHRyYWN0VHJhbnNsYXRpb25zIH0gZnJvbSAnLi4vdHJhbnNsYXRpb25zL2V4dHJhY3RUcmFuc2xhdGlvbnMnXG5leHBvcnQgeyBpMThuSW5pdCB9IGZyb20gJy4uL3RyYW5zbGF0aW9ucy9pbml0J1xuXG5leHBvcnQgeyBjb21iaW5lTWVyZ2UgfSBmcm9tICcuLi91dGlsaXRpZXMvY29tYmluZU1lcmdlJ1xuZXhwb3J0IHsgY29uZmlnVG9KU09OU2NoZW1hLCBlbnRpdHlUb0pTT05TY2hlbWEgfSBmcm9tICcuLi91dGlsaXRpZXMvY29uZmlnVG9KU09OU2NoZW1hJ1xuZXhwb3J0IHsgY3JlYXRlQXJyYXlGcm9tQ29tbWFEZWxpbmVhdGVkIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2NyZWF0ZUFycmF5RnJvbUNvbW1hRGVsaW5lYXRlZCdcblxuZXhwb3J0IHsgZGVlcENvcHlPYmplY3QgfSBmcm9tICcuLi91dGlsaXRpZXMvZGVlcENvcHlPYmplY3QnXG5leHBvcnQgeyBkZWVwTWVyZ2UgfSBmcm9tICcuLi91dGlsaXRpZXMvZGVlcE1lcmdlJ1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBmbGF0dGVuVG9wTGV2ZWxGaWVsZHMgfSBmcm9tICcuLi91dGlsaXRpZXMvZmxhdHRlblRvcExldmVsRmllbGRzJ1xuZXhwb3J0IHsgZ2V0VHJhbnNsYXRpb24gfSBmcm9tICcuLi91dGlsaXRpZXMvZ2V0VHJhbnNsYXRpb24nXG4iXSwibmFtZXMiOlsiZXh0cmFjdFRyYW5zbGF0aW9ucyIsImkxOG5Jbml0IiwiY29tYmluZU1lcmdlIiwiY29uZmlnVG9KU09OU2NoZW1hIiwiZW50aXR5VG9KU09OU2NoZW1hIiwiY3JlYXRlQXJyYXlGcm9tQ29tbWFEZWxpbmVhdGVkIiwiZGVlcENvcHlPYmplY3QiLCJkZWVwTWVyZ2UiLCJmbGF0dGVuVG9wTGV2ZWxGaWVsZHMiLCJnZXRUcmFuc2xhdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBU0EsbUJBQW1CO2VBQW5CQSx3Q0FBbUI7O0lBQ25CQyxRQUFRO2VBQVJBLGNBQVE7O0lBRVJDLFlBQVk7ZUFBWkEsMEJBQVk7O0lBQ1pDLGtCQUFrQjtlQUFsQkEsc0NBQWtCOztJQUFFQyxrQkFBa0I7ZUFBbEJBLHNDQUFrQjs7SUFDdENDLDhCQUE4QjtlQUE5QkEsOERBQThCOztJQUU5QkMsY0FBYztlQUFkQSw4QkFBYzs7SUFDZEMsU0FBUztlQUFUQSxvQkFBUzs7SUFDRUMscUJBQXFCO2VBQXJCQSw4QkFBcUI7O0lBQ2hDQyxjQUFjO2VBQWRBLDhCQUFjOzs7cUNBVmE7c0JBQ1g7OEJBRUk7b0NBQzBCO2dEQUNSO2dDQUVoQjsyQkFDTDs4RUFDdUI7Z0NBQ2xCIn0=