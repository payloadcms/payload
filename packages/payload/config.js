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
    buildConfig: function() {
        return _build.buildConfig;
    },
    fieldTypes: function() {
        return _fieldtypes.fieldTypes;
    },
    defaults: function() {
        return _defaults.defaults;
    },
    sanitizeConfig: function() {
        return _sanitize.sanitizeConfig;
    }
});
const _build = require("./dist/config/build");
_export_star(require("./dist/config/types"), exports);
const _fieldtypes = require("./dist/admin/components/forms/field-types");
const _defaults = require("./dist/config/defaults");
const _sanitize = require("./dist/config/sanitize");
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHBvcnRzL2NvbmZpZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgeyBidWlsZENvbmZpZyB9IGZyb20gJy4uL2NvbmZpZy9idWlsZCdcbmV4cG9ydCAqIGZyb20gJy4uL2NvbmZpZy90eXBlcydcblxuZXhwb3J0IHsgdHlwZSBGaWVsZFR5cGVzLCBmaWVsZFR5cGVzIH0gZnJvbSAnLi4vYWRtaW4vY29tcG9uZW50cy9mb3Jtcy9maWVsZC10eXBlcydcblxuZXhwb3J0IHsgZGVmYXVsdHMgfSBmcm9tICcuLi9jb25maWcvZGVmYXVsdHMnXG5leHBvcnQgeyBzYW5pdGl6ZUNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZy9zYW5pdGl6ZSdcbiJdLCJuYW1lcyI6WyJidWlsZENvbmZpZyIsImZpZWxkVHlwZXMiLCJkZWZhdWx0cyIsInNhbml0aXplQ29uZmlnIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFTQSxXQUFXO2VBQVhBLGtCQUFXOztJQUdNQyxVQUFVO2VBQVZBLHNCQUFVOztJQUUzQkMsUUFBUTtlQUFSQSxrQkFBUTs7SUFDUkMsY0FBYztlQUFkQSx3QkFBYzs7O3VCQU5LO3FCQUNkOzRCQUU4QjswQkFFbkI7MEJBQ00ifQ==