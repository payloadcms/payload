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
    formatUseAsTitle: function() {
        return _useTitle.formatUseAsTitle;
    },
    useDebounce: function() {
        return _useDebounce.default;
    },
    useDebouncedCallback: function() {
        return _useDebouncedCallback.useDebouncedCallback;
    },
    useDelay: function() {
        return _useDelay.useDelay;
    },
    useDelayedRender: function() {
        return _useDelayedRender.useDelayedRender;
    },
    useDocumentEvents: function() {
        return _DocumentEvents.useDocumentEvents;
    },
    useHotkey: function() {
        return _useHotkey.default;
    },
    useIntersect: function() {
        return _useIntersect.default;
    },
    useMountEffect: function() {
        return _useMountEffect.default;
    },
    usePayloadAPI: function() {
        return _usePayloadAPI.default;
    },
    useStepNav: function() {
        return _StepNav.useStepNav;
    },
    useTableColumns: function() {
        return _TableColumns.useTableColumns;
    },
    useThrottledEffect: function() {
        return _useThrottledEffect.default;
    },
    useThumbnail: function() {
        return _useThumbnail.default;
    },
    useTitle: function() {
        return _useTitle.default;
    }
});
const _StepNav = require("../dist/admin/components/elements/StepNav");
const _TableColumns = require("../dist/admin/components/elements/TableColumns");
const _DocumentEvents = require("../dist/admin/components/utilities/DocumentEvents");
const _useDebounce = /*#__PURE__*/ _interop_require_default(require("../dist/admin/hooks/useDebounce"));
const _useDebouncedCallback = require("../dist/admin/hooks/useDebouncedCallback");
const _useDelay = require("../dist/admin/hooks/useDelay");
const _useDelayedRender = require("../dist/admin/hooks/useDelayedRender");
const _useHotkey = /*#__PURE__*/ _interop_require_default(require("../dist/admin/hooks/useHotkey"));
const _useIntersect = /*#__PURE__*/ _interop_require_default(require("../dist/admin/hooks/useIntersect"));
const _useMountEffect = /*#__PURE__*/ _interop_require_default(require("../dist/admin/hooks/useMountEffect"));
const _usePayloadAPI = /*#__PURE__*/ _interop_require_default(require("../dist/admin/hooks/usePayloadAPI"));
const _useThrottledEffect = /*#__PURE__*/ _interop_require_default(require("../dist/admin/hooks/useThrottledEffect"));
const _useThumbnail = /*#__PURE__*/ _interop_require_default(require("../dist/admin/hooks/useThumbnail"));
const _useTitle = /*#__PURE__*/ _interop_require_wildcard(require("../dist/admin/hooks/useTitle"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9leHBvcnRzL2NvbXBvbmVudHMvaG9va3MudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHsgdXNlU3RlcE5hdiB9IGZyb20gJy4uLy4uL2FkbWluL2NvbXBvbmVudHMvZWxlbWVudHMvU3RlcE5hdidcbmV4cG9ydCB7IHVzZVRhYmxlQ29sdW1ucyB9IGZyb20gJy4uLy4uL2FkbWluL2NvbXBvbmVudHMvZWxlbWVudHMvVGFibGVDb2x1bW5zJ1xuZXhwb3J0IHsgdXNlRG9jdW1lbnRFdmVudHMgfSBmcm9tICcuLi8uLi9hZG1pbi9jb21wb25lbnRzL3V0aWxpdGllcy9Eb2N1bWVudEV2ZW50cydcbmV4cG9ydCB7IGRlZmF1bHQgYXMgdXNlRGVib3VuY2UgfSBmcm9tICcuLi8uLi9hZG1pbi9ob29rcy91c2VEZWJvdW5jZSdcbmV4cG9ydCB7IHVzZURlYm91bmNlZENhbGxiYWNrIH0gZnJvbSAnLi4vLi4vYWRtaW4vaG9va3MvdXNlRGVib3VuY2VkQ2FsbGJhY2snXG5leHBvcnQgeyB1c2VEZWxheSB9IGZyb20gJy4uLy4uL2FkbWluL2hvb2tzL3VzZURlbGF5J1xuZXhwb3J0IHsgdXNlRGVsYXllZFJlbmRlciB9IGZyb20gJy4uLy4uL2FkbWluL2hvb2tzL3VzZURlbGF5ZWRSZW5kZXInXG5leHBvcnQgeyBkZWZhdWx0IGFzIHVzZUhvdGtleSB9IGZyb20gJy4uLy4uL2FkbWluL2hvb2tzL3VzZUhvdGtleSdcbmV4cG9ydCB7IGRlZmF1bHQgYXMgdXNlSW50ZXJzZWN0IH0gZnJvbSAnLi4vLi4vYWRtaW4vaG9va3MvdXNlSW50ZXJzZWN0J1xuZXhwb3J0IHsgZGVmYXVsdCBhcyB1c2VNb3VudEVmZmVjdCB9IGZyb20gJy4uLy4uL2FkbWluL2hvb2tzL3VzZU1vdW50RWZmZWN0J1xuZXhwb3J0IHsgZGVmYXVsdCBhcyB1c2VQYXlsb2FkQVBJIH0gZnJvbSAnLi4vLi4vYWRtaW4vaG9va3MvdXNlUGF5bG9hZEFQSSdcbmV4cG9ydCB7IGRlZmF1bHQgYXMgdXNlVGhyb3R0bGVkRWZmZWN0IH0gZnJvbSAnLi4vLi4vYWRtaW4vaG9va3MvdXNlVGhyb3R0bGVkRWZmZWN0J1xuZXhwb3J0IHsgZGVmYXVsdCBhcyB1c2VUaHVtYm5haWwgfSBmcm9tICcuLi8uLi9hZG1pbi9ob29rcy91c2VUaHVtYm5haWwnXG5leHBvcnQgeyBkZWZhdWx0IGFzIHVzZVRpdGxlLCBmb3JtYXRVc2VBc1RpdGxlIH0gZnJvbSAnLi4vLi4vYWRtaW4vaG9va3MvdXNlVGl0bGUnXG4iXSwibmFtZXMiOlsiZm9ybWF0VXNlQXNUaXRsZSIsInVzZURlYm91bmNlIiwidXNlRGVib3VuY2VkQ2FsbGJhY2siLCJ1c2VEZWxheSIsInVzZURlbGF5ZWRSZW5kZXIiLCJ1c2VEb2N1bWVudEV2ZW50cyIsInVzZUhvdGtleSIsInVzZUludGVyc2VjdCIsInVzZU1vdW50RWZmZWN0IiwidXNlUGF5bG9hZEFQSSIsInVzZVN0ZXBOYXYiLCJ1c2VUYWJsZUNvbHVtbnMiLCJ1c2VUaHJvdHRsZWRFZmZlY3QiLCJ1c2VUaHVtYm5haWwiLCJ1c2VUaXRsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFhOEJBLGdCQUFnQjtlQUFoQkEsMEJBQWdCOztJQVYxQkMsV0FBVztlQUFYQSxvQkFBVzs7SUFDdEJDLG9CQUFvQjtlQUFwQkEsMENBQW9COztJQUNwQkMsUUFBUTtlQUFSQSxrQkFBUTs7SUFDUkMsZ0JBQWdCO2VBQWhCQSxrQ0FBZ0I7O0lBSmhCQyxpQkFBaUI7ZUFBakJBLGlDQUFpQjs7SUFLTkMsU0FBUztlQUFUQSxrQkFBUzs7SUFDVEMsWUFBWTtlQUFaQSxxQkFBWTs7SUFDWkMsY0FBYztlQUFkQSx1QkFBYzs7SUFDZEMsYUFBYTtlQUFiQSxzQkFBYTs7SUFWeEJDLFVBQVU7ZUFBVkEsbUJBQVU7O0lBQ1ZDLGVBQWU7ZUFBZkEsNkJBQWU7O0lBVUpDLGtCQUFrQjtlQUFsQkEsMkJBQWtCOztJQUNsQkMsWUFBWTtlQUFaQSxxQkFBWTs7SUFDWkMsUUFBUTtlQUFSQSxpQkFBUTs7O3lCQWJEOzhCQUNLO2dDQUNFO29FQUNLO3NDQUNGOzBCQUNaO2tDQUNRO2tFQUNJO3FFQUNHO3VFQUNFO3NFQUNEOzJFQUNLO3FFQUNOO2tFQUNjIn0=