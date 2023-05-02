"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const RenderFields_1 = __importDefault(require("../../RenderFields"));
const withCondition_1 = __importDefault(require("../../withCondition"));
const createNestedFieldPath_1 = require("../../Form/createNestedFieldPath");
const provider_1 = require("./provider");
require("./index.scss");
const Row = (props) => {
    const { fields, fieldTypes, path, permissions, admin: { readOnly, className, }, indexPath, } = props;
    const classes = [
        'field-type',
        'row',
        className,
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement(provider_1.RowProvider, null,
        react_1.default.createElement(RenderFields_1.default, { readOnly: readOnly, className: classes, permissions: permissions, fieldTypes: fieldTypes, indexPath: indexPath, fieldSchema: fields.map((field) => ({
                ...field,
                path: (0, createNestedFieldPath_1.createNestedFieldPath)(path, field),
            })) })));
};
exports.default = (0, withCondition_1.default)(Row);
//# sourceMappingURL=index.js.map