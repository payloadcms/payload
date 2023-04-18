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
const Config_1 = require("../../../utilities/Config");
const useField_1 = __importDefault(require("../../useField"));
const withCondition_1 = __importDefault(require("../../withCondition"));
const validations_1 = require("../../../../../fields/validations");
const Input_1 = __importDefault(require("./Input"));
require("./index.scss");
const Upload = (props) => {
    const { collections, serverURL, routes: { api, }, } = (0, Config_1.useConfig)();
    const { path, name, required, admin: { readOnly, style, className, width, description, condition, } = {}, label, validate = validations_1.upload, relationTo, fieldTypes, filterOptions, } = props;
    const collection = collections.find((coll) => coll.slug === relationTo);
    const memoizedValidate = (0, react_1.useCallback)((value, options) => {
        return validate(value, { ...options, required });
    }, [validate, required]);
    const field = (0, useField_1.default)({
        path,
        validate: memoizedValidate,
        condition,
    });
    const { value, showError, setValue, errorMessage, } = field;
    const onChange = (0, react_1.useCallback)((incomingValue) => {
        const incomingID = (incomingValue === null || incomingValue === void 0 ? void 0 : incomingValue.id) || incomingValue;
        setValue(incomingID);
    }, [
        setValue,
    ]);
    if (collection.upload) {
        return (react_1.default.createElement(Input_1.default, { path: path, value: value, onChange: onChange, description: description, label: label, required: required, showError: showError, serverURL: serverURL, api: api, errorMessage: errorMessage, readOnly: readOnly, style: style, className: className, width: width, collection: collection, fieldTypes: fieldTypes, name: name, relationTo: relationTo, filterOptions: filterOptions }));
    }
    return null;
};
exports.default = (0, withCondition_1.default)(Upload);
//# sourceMappingURL=index.js.map