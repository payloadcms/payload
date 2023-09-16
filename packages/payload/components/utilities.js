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
    useAuth: function() {
        return _Auth.useAuth;
    },
    useConfig: function() {
        return _Config.useConfig;
    },
    useDocumentInfo: function() {
        return _DocumentInfo.useDocumentInfo;
    },
    useEditDepth: function() {
        return _EditDepth.useEditDepth;
    },
    useLocale: function() {
        return _Locale.useLocale;
    },
    Meta: function() {
        return _Meta.default;
    }
});
const _Auth = require("../dist/admin/components/utilities/Auth");
const _Config = require("../dist/admin/components/utilities/Config");
const _DocumentInfo = require("../dist/admin/components/utilities/DocumentInfo");
const _EditDepth = require("../dist/admin/components/utilities/EditDepth");
const _Locale = require("../dist/admin/components/utilities/Locale");
const _Meta = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/utilities/Meta"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9leHBvcnRzL2NvbXBvbmVudHMvdXRpbGl0aWVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7IHVzZUF1dGggfSBmcm9tICcuLi8uLi9hZG1pbi9jb21wb25lbnRzL3V0aWxpdGllcy9BdXRoJ1xuZXhwb3J0IHsgdXNlQ29uZmlnIH0gZnJvbSAnLi4vLi4vYWRtaW4vY29tcG9uZW50cy91dGlsaXRpZXMvQ29uZmlnJ1xuZXhwb3J0IHsgdXNlRG9jdW1lbnRJbmZvIH0gZnJvbSAnLi4vLi4vYWRtaW4vY29tcG9uZW50cy91dGlsaXRpZXMvRG9jdW1lbnRJbmZvJ1xuZXhwb3J0IHsgdXNlRWRpdERlcHRoIH0gZnJvbSAnLi4vLi4vYWRtaW4vY29tcG9uZW50cy91dGlsaXRpZXMvRWRpdERlcHRoJ1xuZXhwb3J0IHsgdXNlTG9jYWxlIH0gZnJvbSAnLi4vLi4vYWRtaW4vY29tcG9uZW50cy91dGlsaXRpZXMvTG9jYWxlJ1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBNZXRhIH0gZnJvbSAnLi4vLi4vYWRtaW4vY29tcG9uZW50cy91dGlsaXRpZXMvTWV0YSdcbiJdLCJuYW1lcyI6WyJ1c2VBdXRoIiwidXNlQ29uZmlnIiwidXNlRG9jdW1lbnRJbmZvIiwidXNlRWRpdERlcHRoIiwidXNlTG9jYWxlIiwiTWV0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBU0EsT0FBTztlQUFQQSxhQUFPOztJQUNQQyxTQUFTO2VBQVRBLGlCQUFTOztJQUNUQyxlQUFlO2VBQWZBLDZCQUFlOztJQUNmQyxZQUFZO2VBQVpBLHVCQUFZOztJQUNaQyxTQUFTO2VBQVRBLGlCQUFTOztJQUNFQyxJQUFJO2VBQUpBLGFBQUk7OztzQkFMQTt3QkFDRTs4QkFDTTsyQkFDSDt3QkFDSDs2REFDTSJ9