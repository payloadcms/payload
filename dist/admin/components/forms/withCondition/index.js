'use client';
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
const context_1 = require("../Form/context");
const getSiblingData_1 = __importDefault(require("../Form/getSiblingData"));
const reduceFieldsToValues_1 = __importDefault(require("../Form/reduceFieldsToValues"));
const withCondition = (Field) => {
    const CheckForCondition = (props) => {
        const { admin: { condition, } = {}, } = props;
        if (condition) {
            return react_1.default.createElement(WithCondition, { ...props });
        }
        return react_1.default.createElement(Field, { ...props });
    };
    const WithCondition = (props) => {
        const { name, path: pathFromProps, admin: { condition, } = {}, } = props;
        const path = typeof pathFromProps === 'string' ? pathFromProps : name;
        const [fields, dispatchFields] = (0, context_1.useAllFormFields)();
        const data = (0, reduceFieldsToValues_1.default)(fields, true);
        const siblingData = (0, getSiblingData_1.default)(fields, path);
        const hasCondition = Boolean(condition);
        const currentlyPassesCondition = hasCondition ? condition(data, siblingData) : true;
        const field = fields[path];
        const existingConditionPasses = field === null || field === void 0 ? void 0 : field.passesCondition;
        (0, react_1.useEffect)(() => {
            if (hasCondition) {
                if (!existingConditionPasses && currentlyPassesCondition) {
                    dispatchFields({ type: 'MODIFY_CONDITION', path, result: true });
                }
                if (!currentlyPassesCondition && (existingConditionPasses || typeof existingConditionPasses === 'undefined')) {
                    dispatchFields({ type: 'MODIFY_CONDITION', path, result: false });
                }
            }
        }, [currentlyPassesCondition, existingConditionPasses, dispatchFields, path, hasCondition]);
        if (currentlyPassesCondition) {
            return react_1.default.createElement(Field, { ...props });
        }
        return null;
    };
    return CheckForCondition;
};
exports.default = withCondition;
//# sourceMappingURL=index.js.map