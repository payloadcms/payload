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
    buildStateFromSchema: function() {
        return _buildStateFromSchema.default;
    },
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
    },
    withMergedProps: function() {
        return _WithMergedProps.withMergedProps;
    }
});
const _buildStateFromSchema = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/Form/buildStateFromSchema"));
const _Auth = require("../dist/admin/components/utilities/Auth");
const _Config = require("../dist/admin/components/utilities/Config");
const _DocumentInfo = require("../dist/admin/components/utilities/DocumentInfo");
const _EditDepth = require("../dist/admin/components/utilities/EditDepth");
const _Locale = require("../dist/admin/components/utilities/Locale");
const _Meta = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/utilities/Meta"));
const _WithMergedProps = require("../dist/admin/components/utilities/WithMergedProps");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9leHBvcnRzL2NvbXBvbmVudHMvdXRpbGl0aWVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7IGRlZmF1bHQgYXMgYnVpbGRTdGF0ZUZyb21TY2hlbWEgfSBmcm9tICcuLi8uLi9hZG1pbi9jb21wb25lbnRzL2Zvcm1zL0Zvcm0vYnVpbGRTdGF0ZUZyb21TY2hlbWEnXG5leHBvcnQgeyB1c2VBdXRoIH0gZnJvbSAnLi4vLi4vYWRtaW4vY29tcG9uZW50cy91dGlsaXRpZXMvQXV0aCdcbmV4cG9ydCB7IHVzZUNvbmZpZyB9IGZyb20gJy4uLy4uL2FkbWluL2NvbXBvbmVudHMvdXRpbGl0aWVzL0NvbmZpZydcbmV4cG9ydCB7IHVzZURvY3VtZW50SW5mbyB9IGZyb20gJy4uLy4uL2FkbWluL2NvbXBvbmVudHMvdXRpbGl0aWVzL0RvY3VtZW50SW5mbydcbmV4cG9ydCB7IHVzZUVkaXREZXB0aCB9IGZyb20gJy4uLy4uL2FkbWluL2NvbXBvbmVudHMvdXRpbGl0aWVzL0VkaXREZXB0aCdcbmV4cG9ydCB7IHVzZUxvY2FsZSB9IGZyb20gJy4uLy4uL2FkbWluL2NvbXBvbmVudHMvdXRpbGl0aWVzL0xvY2FsZSdcbmV4cG9ydCB7IGRlZmF1bHQgYXMgTWV0YSB9IGZyb20gJy4uLy4uL2FkbWluL2NvbXBvbmVudHMvdXRpbGl0aWVzL01ldGEnXG5leHBvcnQgeyB3aXRoTWVyZ2VkUHJvcHMgfSBmcm9tICcuLi8uLi9hZG1pbi9jb21wb25lbnRzL3V0aWxpdGllcy9XaXRoTWVyZ2VkUHJvcHMnXG4iXSwibmFtZXMiOlsiYnVpbGRTdGF0ZUZyb21TY2hlbWEiLCJ1c2VBdXRoIiwidXNlQ29uZmlnIiwidXNlRG9jdW1lbnRJbmZvIiwidXNlRWRpdERlcHRoIiwidXNlTG9jYWxlIiwiTWV0YSIsIndpdGhNZXJnZWRQcm9wcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBb0JBLG9CQUFvQjtlQUFwQkEsNkJBQW9COztJQUMvQkMsT0FBTztlQUFQQSxhQUFPOztJQUNQQyxTQUFTO2VBQVRBLGlCQUFTOztJQUNUQyxlQUFlO2VBQWZBLDZCQUFlOztJQUNmQyxZQUFZO2VBQVpBLHVCQUFZOztJQUNaQyxTQUFTO2VBQVRBLGlCQUFTOztJQUNFQyxJQUFJO2VBQUpBLGFBQUk7O0lBQ2ZDLGVBQWU7ZUFBZkEsZ0NBQWU7Ozs2RUFQd0I7c0JBQ3hCO3dCQUNFOzhCQUNNOzJCQUNIO3dCQUNIOzZEQUNNO2lDQUNBIn0=