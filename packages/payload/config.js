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
    defaults: function() {
        return _defaults.defaults;
    },
    sanitizeConfig: function() {
        return _sanitize.sanitizeConfig;
    }
});
const _build = require("./dist/config/build");
_export_star(require("./dist/config/types"), exports);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHBvcnRzL2NvbmZpZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgeyBidWlsZENvbmZpZyB9IGZyb20gJy4uL2NvbmZpZy9idWlsZCdcbmV4cG9ydCAqIGZyb20gJy4uL2NvbmZpZy90eXBlcydcblxuZXhwb3J0IHsgZGVmYXVsdHMgfSBmcm9tICcuLi9jb25maWcvZGVmYXVsdHMnXG5cbmV4cG9ydCB7IHNhbml0aXplQ29uZmlnIH0gZnJvbSAnLi4vY29uZmlnL3Nhbml0aXplJ1xuIl0sIm5hbWVzIjpbImJ1aWxkQ29uZmlnIiwiZGVmYXVsdHMiLCJzYW5pdGl6ZUNvbmZpZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBU0EsV0FBVztlQUFYQSxrQkFBVzs7SUFHWEMsUUFBUTtlQUFSQSxrQkFBUTs7SUFFUkMsY0FBYztlQUFkQSx3QkFBYzs7O3VCQUxLO3FCQUNkOzBCQUVXOzBCQUVNIn0=