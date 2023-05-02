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
const RenderCustomComponent_1 = __importDefault(require("../../../utilities/RenderCustomComponent"));
const ReactSelect_1 = __importDefault(require("../../ReactSelect"));
const Button_1 = __importDefault(require("../../Button"));
const Date_1 = __importDefault(require("./Date"));
const Number_1 = __importDefault(require("./Number"));
const Text_1 = __importDefault(require("./Text"));
const Relationship_1 = __importDefault(require("./Relationship"));
const useDebounce_1 = __importDefault(require("../../../../hooks/useDebounce"));
require("./index.scss");
const valueFields = {
    Date: Date_1.default,
    Number: Number_1.default,
    Text: Text_1.default,
    Relationship: Relationship_1.default,
};
const baseClass = 'condition';
const Condition = (props) => {
    var _a, _b, _c;
    const { fields, dispatch, value, orIndex, andIndex, } = props;
    const fieldValue = Object.keys(value)[0];
    const operatorAndValue = (value === null || value === void 0 ? void 0 : value[fieldValue]) ? Object.entries(value[fieldValue])[0] : undefined;
    const operatorValue = operatorAndValue === null || operatorAndValue === void 0 ? void 0 : operatorAndValue[0];
    const queryValue = operatorAndValue === null || operatorAndValue === void 0 ? void 0 : operatorAndValue[1];
    const [activeField, setActiveField] = (0, react_1.useState)(() => fields.find((field) => fieldValue === field.value));
    const [internalValue, setInternalValue] = (0, react_1.useState)(queryValue);
    const debouncedValue = (0, useDebounce_1.default)(internalValue, 300);
    (0, react_1.useEffect)(() => {
        const newActiveField = fields.find((field) => fieldValue === field.value);
        if (newActiveField) {
            setActiveField(newActiveField);
        }
    }, [fieldValue, fields]);
    (0, react_1.useEffect)(() => {
        dispatch({
            type: 'update',
            orIndex,
            andIndex,
            value: debouncedValue || '',
        });
    }, [debouncedValue, dispatch, orIndex, andIndex]);
    const ValueComponent = valueFields[activeField === null || activeField === void 0 ? void 0 : activeField.component] || valueFields.Text;
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement("div", { className: `${baseClass}__wrap` },
            react_1.default.createElement("div", { className: `${baseClass}__inputs` },
                react_1.default.createElement("div", { className: `${baseClass}__field` },
                    react_1.default.createElement(ReactSelect_1.default, { value: fields.find((field) => fieldValue === field.value), options: fields, onChange: (field) => dispatch({
                            type: 'update',
                            orIndex,
                            andIndex,
                            field: field.value,
                        }) })),
                react_1.default.createElement("div", { className: `${baseClass}__operator` },
                    react_1.default.createElement(ReactSelect_1.default, { disabled: !fieldValue, value: activeField.operators.find((operator) => operatorValue === operator.value), options: activeField.operators, onChange: (operator) => {
                            dispatch({
                                type: 'update',
                                orIndex,
                                andIndex,
                                operator: operator.value,
                            });
                        } })),
                react_1.default.createElement("div", { className: `${baseClass}__value` },
                    react_1.default.createElement(RenderCustomComponent_1.default, { CustomComponent: (_c = (_b = (_a = activeField === null || activeField === void 0 ? void 0 : activeField.props) === null || _a === void 0 ? void 0 : _a.admin) === null || _b === void 0 ? void 0 : _b.components) === null || _c === void 0 ? void 0 : _c.Filter, DefaultComponent: ValueComponent, componentProps: {
                            ...activeField === null || activeField === void 0 ? void 0 : activeField.props,
                            operator: operatorValue,
                            value: internalValue,
                            onChange: setInternalValue,
                        } }))),
            react_1.default.createElement("div", { className: `${baseClass}__actions` },
                react_1.default.createElement(Button_1.default, { icon: "x", className: `${baseClass}__actions-remove`, round: true, buttonStyle: "icon-label", iconStyle: "with-border", onClick: () => dispatch({
                        type: 'remove',
                        orIndex,
                        andIndex,
                    }) }),
                react_1.default.createElement(Button_1.default, { icon: "plus", className: `${baseClass}__actions-add`, round: true, buttonStyle: "icon-label", iconStyle: "with-border", onClick: () => dispatch({
                        type: 'add',
                        field: fields[0].value,
                        relation: 'and',
                        orIndex,
                        andIndex: andIndex + 1,
                    }) })))));
};
exports.default = Condition;
//# sourceMappingURL=index.js.map