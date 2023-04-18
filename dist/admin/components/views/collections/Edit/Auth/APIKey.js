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
const uuid_1 = require("uuid");
const react_i18next_1 = require("react-i18next");
const useField_1 = __importDefault(require("../../../../forms/useField"));
const Label_1 = __importDefault(require("../../../../forms/Label"));
const CopyToClipboard_1 = __importDefault(require("../../../../elements/CopyToClipboard"));
const validations_1 = require("../../../../../../fields/validations");
const context_1 = require("../../../../forms/Form/context");
const GenerateConfirmation_1 = __importDefault(require("../../../../elements/GenerateConfirmation"));
const path = 'apiKey';
const baseClass = 'api-key';
const APIKey = () => {
    const [initialAPIKey, setInitialAPIKey] = (0, react_1.useState)(null);
    const [highlightedField, setHighlightedField] = (0, react_1.useState)(false);
    const { t } = (0, react_i18next_1.useTranslation)();
    const apiKey = (0, context_1.useFormFields)(([fields]) => fields[path]);
    const validate = (val) => (0, validations_1.text)(val, { minLength: 24, maxLength: 48, data: {}, siblingData: {}, t });
    const apiKeyValue = apiKey === null || apiKey === void 0 ? void 0 : apiKey.value;
    const APIKeyLabel = (0, react_1.useMemo)(() => (react_1.default.createElement("div", { className: `${baseClass}__label` },
        react_1.default.createElement("span", null, "API Key"),
        react_1.default.createElement(CopyToClipboard_1.default, { value: apiKeyValue }))), [apiKeyValue]);
    const fieldType = (0, useField_1.default)({
        path: 'apiKey',
        validate,
    });
    const highlightField = () => {
        if (highlightedField) {
            setHighlightedField(false);
        }
        setTimeout(() => {
            setHighlightedField(true);
        }, 1);
    };
    const { value, setValue, } = fieldType;
    (0, react_1.useEffect)(() => {
        setInitialAPIKey((0, uuid_1.v4)());
    }, []);
    (0, react_1.useEffect)(() => {
        if (!apiKeyValue) {
            setValue(initialAPIKey);
        }
    }, [apiKeyValue, setValue, initialAPIKey]);
    (0, react_1.useEffect)(() => {
        if (highlightedField) {
            setTimeout(() => {
                setHighlightedField(false);
            }, 10000);
        }
    }, [highlightedField]);
    const classes = [
        'field-type',
        'api-key',
        'read-only',
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("div", { className: classes },
            react_1.default.createElement(Label_1.default, { htmlFor: path, label: APIKeyLabel }),
            react_1.default.createElement("input", { value: value || '', className: highlightedField ? 'highlight' : undefined, disabled: true, type: "text", id: "apiKey", name: "apiKey" })),
        react_1.default.createElement(GenerateConfirmation_1.default, { setKey: () => setValue((0, uuid_1.v4)()), highlightField: highlightField })));
};
exports.default = APIKey;
//# sourceMappingURL=APIKey.js.map