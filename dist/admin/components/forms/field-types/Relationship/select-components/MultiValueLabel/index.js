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
exports.MultiValueLabel = void 0;
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const react_select_1 = require("react-select");
const DocumentDrawer_1 = require("../../../../../elements/DocumentDrawer");
const Tooltip_1 = __importDefault(require("../../../../../elements/Tooltip"));
const Edit_1 = __importDefault(require("../../../../../icons/Edit"));
const Auth_1 = require("../../../../../utilities/Auth");
require("./index.scss");
const baseClass = 'relationship--multi-value-label';
const MultiValueLabel = (props) => {
    var _a, _b, _c;
    const { data: { value, relationTo, label, }, selectProps: { setDrawerIsOpen, draggableProps, onSave, }, } = props;
    const { permissions } = (0, Auth_1.useAuth)();
    const [showTooltip, setShowTooltip] = (0, react_1.useState)(false);
    const { t } = (0, react_i18next_1.useTranslation)('general');
    const hasReadPermission = Boolean((_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[relationTo]) === null || _b === void 0 ? void 0 : _b.read) === null || _c === void 0 ? void 0 : _c.permission);
    const [DocumentDrawer, DocumentDrawerToggler, { isDrawerOpen }] = (0, DocumentDrawer_1.useDocumentDrawer)({
        id: value === null || value === void 0 ? void 0 : value.toString(),
        collectionSlug: relationTo,
    });
    (0, react_1.useEffect)(() => {
        if (typeof setDrawerIsOpen === 'function')
            setDrawerIsOpen(isDrawerOpen);
    }, [isDrawerOpen, setDrawerIsOpen]);
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement("div", { className: `${baseClass}__content` },
            react_1.default.createElement(react_select_1.components.MultiValueLabel, { ...props, innerProps: {
                    className: `${baseClass}__text`,
                    ...draggableProps || {},
                } })),
        relationTo && hasReadPermission && (react_1.default.createElement(react_1.Fragment, null,
            react_1.default.createElement(DocumentDrawerToggler, { className: `${baseClass}__drawer-toggler`, "aria-label": `Edit ${label}`, onMouseEnter: () => setShowTooltip(true), onMouseLeave: () => setShowTooltip(false), onClick: () => setShowTooltip(false) },
                react_1.default.createElement(Tooltip_1.default, { className: `${baseClass}__tooltip`, show: showTooltip }, t('editLabel', { label: '' })),
                react_1.default.createElement(Edit_1.default, null)),
            react_1.default.createElement(DocumentDrawer, { onSave: onSave })))));
};
exports.MultiValueLabel = MultiValueLabel;
//# sourceMappingURL=index.js.map