"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const RenderCustomComponent_1 = __importDefault(require("../../utilities/RenderCustomComponent"));
const useIntersect_1 = __importDefault(require("../../../hooks/useIntersect"));
const types_1 = require("../../../../fields/config/types");
const OperationProvider_1 = require("../../utilities/OperationProvider");
const getTranslation_1 = require("../../../../utilities/getTranslation");
const baseClass = 'render-fields';
const intersectionObserverOptions = {
    rootMargin: '1000px',
};
const RenderFields = (props) => {
    var _a;
    const { fieldSchema, fieldTypes, filter, permissions, readOnly: readOnlyOverride, className, forceRender, indexPath: incomingIndexPath, } = props;
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const [hasRendered, setHasRendered] = (0, react_1.useState)(Boolean(forceRender));
    const [intersectionRef, entry] = (0, useIntersect_1.default)(intersectionObserverOptions);
    const operation = (0, OperationProvider_1.useOperation)();
    const isIntersecting = Boolean(entry === null || entry === void 0 ? void 0 : entry.isIntersecting);
    const isAboveViewport = ((_a = entry === null || entry === void 0 ? void 0 : entry.boundingClientRect) === null || _a === void 0 ? void 0 : _a.top) < 0;
    const shouldRender = forceRender || isIntersecting || isAboveViewport;
    (0, react_1.useEffect)(() => {
        if (shouldRender && !hasRendered) {
            setHasRendered(true);
        }
    }, [shouldRender, hasRendered]);
    const classes = [
        baseClass,
        className,
    ].filter(Boolean).join(' ');
    if (fieldSchema) {
        return (react_1.default.createElement("div", { ref: intersectionRef, className: classes }, hasRendered && (fieldSchema.map((field, fieldIndex) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const fieldIsPresentational = (0, types_1.fieldIsPresentationalOnly)(field);
            let FieldComponent = fieldTypes[field.type];
            if (fieldIsPresentational || (!(field === null || field === void 0 ? void 0 : field.hidden) && ((_a = field === null || field === void 0 ? void 0 : field.admin) === null || _a === void 0 ? void 0 : _a.disabled) !== true)) {
                if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
                    if (fieldIsPresentational) {
                        return (react_1.default.createElement(FieldComponent, { ...field, key: fieldIndex }));
                    }
                    if ((_b = field === null || field === void 0 ? void 0 : field.admin) === null || _b === void 0 ? void 0 : _b.hidden) {
                        FieldComponent = fieldTypes.hidden;
                    }
                    const isFieldAffectingData = (0, types_1.fieldAffectsData)(field);
                    const fieldPermissions = isFieldAffectingData ? permissions === null || permissions === void 0 ? void 0 : permissions[field.name] : permissions;
                    let { admin: { readOnly } = {} } = field;
                    if (readOnlyOverride && readOnly !== false)
                        readOnly = true;
                    if ((isFieldAffectingData && ((_d = (_c = permissions === null || permissions === void 0 ? void 0 : permissions[field === null || field === void 0 ? void 0 : field.name]) === null || _c === void 0 ? void 0 : _c.read) === null || _d === void 0 ? void 0 : _d.permission) !== false) || !isFieldAffectingData) {
                        if (isFieldAffectingData && ((_f = (_e = permissions === null || permissions === void 0 ? void 0 : permissions[field === null || field === void 0 ? void 0 : field.name]) === null || _e === void 0 ? void 0 : _e[operation]) === null || _f === void 0 ? void 0 : _f.permission) === false) {
                            readOnly = true;
                        }
                        if (FieldComponent) {
                            return (react_1.default.createElement(RenderCustomComponent_1.default, { key: fieldIndex, CustomComponent: (_h = (_g = field === null || field === void 0 ? void 0 : field.admin) === null || _g === void 0 ? void 0 : _g.components) === null || _h === void 0 ? void 0 : _h.Field, DefaultComponent: FieldComponent, componentProps: {
                                    ...field,
                                    path: field.path || (isFieldAffectingData ? field.name : ''),
                                    fieldTypes,
                                    indexPath: incomingIndexPath ? `${incomingIndexPath}.${fieldIndex}` : `${fieldIndex}`,
                                    admin: {
                                        ...(field.admin || {}),
                                        readOnly,
                                    },
                                    permissions: fieldPermissions,
                                } }));
                        }
                        return (react_1.default.createElement("div", { className: "missing-field", key: fieldIndex }, t('error:noMatchedField', { label: (0, types_1.fieldAffectsData)(field) ? (0, getTranslation_1.getTranslation)(field.label || field.name, i18n) : field.path })));
                    }
                }
                return null;
            }
            return null;
        }))));
    }
    return null;
};
exports.default = RenderFields;
//# sourceMappingURL=index.js.map