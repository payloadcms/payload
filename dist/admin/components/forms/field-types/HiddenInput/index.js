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
const useField_1 = __importDefault(require("../../useField"));
const withCondition_1 = __importDefault(require("../../withCondition"));
const HiddenInput = (props) => {
    const { name, path: pathFromProps, value: valueFromProps, disableModifyingForm = true, } = props;
    const path = pathFromProps || name;
    const { value, setValue } = (0, useField_1.default)({
        path,
    });
    (0, react_1.useEffect)(() => {
        if (valueFromProps !== undefined) {
            setValue(valueFromProps, disableModifyingForm);
        }
    }, [valueFromProps, setValue, disableModifyingForm]);
    return (react_1.default.createElement("input", { id: `field-${path.replace(/\./gi, '__')}`, type: "hidden", value: value || '', onChange: setValue, name: path }));
};
exports.default = (0, withCondition_1.default)(HiddenInput);
//# sourceMappingURL=index.js.map