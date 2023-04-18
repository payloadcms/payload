"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const RenderFields_1 = __importDefault(require("../../RenderFields"));
const withCondition_1 = __importDefault(require("../../withCondition"));
const FieldDescription_1 = __importDefault(require("../../FieldDescription"));
const provider_1 = require("../../../elements/Collapsible/provider");
const provider_2 = require("./provider");
const provider_3 = require("../Row/provider");
const provider_4 = require("../Tabs/provider");
const getTranslation_1 = require("../../../../../utilities/getTranslation");
const createNestedFieldPath_1 = require("../../Form/createNestedFieldPath");
require("./index.scss");
const baseClass = 'group-field';
const Group = (props) => {
    const { label, fields, name, path: pathFromProps, fieldTypes, indexPath, admin: { readOnly, style, className, width, description, hideGutter = false, }, permissions, } = props;
    const isWithinCollapsible = (0, provider_1.useCollapsible)();
    const isWithinGroup = (0, provider_2.useGroup)();
    const isWithinRow = (0, provider_3.useRow)();
    const isWithinTab = (0, provider_4.useTabs)();
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const path = pathFromProps || name;
    return (react_1.default.createElement("div", { id: `field-${path.replace(/\./gi, '__')}`, className: [
            'field-type',
            baseClass,
            isWithinCollapsible && `${baseClass}--within-collapsible`,
            isWithinGroup && `${baseClass}--within-group`,
            isWithinRow && `${baseClass}--within-row`,
            isWithinTab && `${baseClass}--within-tab`,
            (!hideGutter && isWithinGroup) && `${baseClass}--gutter`,
            className,
        ].filter(Boolean).join(' '), style: {
            ...style,
            width,
        } },
        react_1.default.createElement(provider_2.GroupProvider, null,
            react_1.default.createElement("div", { className: `${baseClass}__wrap` },
                (label || description) && (react_1.default.createElement("header", { className: `${baseClass}__header` },
                    label && (react_1.default.createElement("h3", { className: `${baseClass}__title` }, (0, getTranslation_1.getTranslation)(label, i18n))),
                    react_1.default.createElement(FieldDescription_1.default, { className: `field-description-${path.replace(/\./gi, '__')}`, value: null, description: description }))),
                react_1.default.createElement(RenderFields_1.default, { permissions: permissions === null || permissions === void 0 ? void 0 : permissions.fields, readOnly: readOnly, fieldTypes: fieldTypes, indexPath: indexPath, fieldSchema: fields.map((subField) => ({
                        ...subField,
                        path: (0, createNestedFieldPath_1.createNestedFieldPath)(path, subField),
                    })) })))));
};
exports.default = (0, withCondition_1.default)(Group);
//# sourceMappingURL=index.js.map