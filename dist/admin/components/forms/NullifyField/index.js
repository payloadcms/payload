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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullifyLocaleField = void 0;
const React = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const Input_1 = require("../field-types/Checkbox/Input");
const Banner_1 = require("../../elements/Banner");
const Locale_1 = require("../../utilities/Locale");
const Config_1 = require("../../utilities/Config");
const context_1 = require("../Form/context");
const NullifyLocaleField = ({ localized, path, fieldValue }) => {
    const { dispatchFields, setModified } = (0, context_1.useForm)();
    const currentLocale = (0, Locale_1.useLocale)();
    const { localization } = (0, Config_1.useConfig)();
    const [checked, setChecked] = React.useState(typeof fieldValue !== 'number');
    const defaultLocale = (localization && localization.defaultLocale) ? localization.defaultLocale : 'en';
    const { t } = (0, react_i18next_1.useTranslation)('general');
    const onChange = () => {
        const useFallback = !checked;
        dispatchFields({
            type: 'UPDATE',
            path,
            value: useFallback ? null : (fieldValue || 0),
        });
        setModified(true);
        setChecked(useFallback);
    };
    if (!localized || currentLocale === defaultLocale || (localization && !localization.fallback)) {
        // hide when field is not localized or editing default locale or when fallback is disabled
        return null;
    }
    if (fieldValue) {
        let hideCheckbox = false;
        if (typeof fieldValue === 'number' && fieldValue > 0)
            hideCheckbox = true;
        if (Array.isArray(fieldValue) && fieldValue.length > 0)
            hideCheckbox = true;
        if (hideCheckbox) {
            if (checked)
                setChecked(false); // uncheck when field has value
            return null;
        }
    }
    return (React.createElement(Banner_1.Banner, null,
        React.createElement(Input_1.CheckboxInput, { id: `field-${path.replace(/\./gi, '__')}`, onToggle: onChange, label: t('fallbackToDefaultLocale'), checked: checked })));
};
exports.NullifyLocaleField = NullifyLocaleField;
//# sourceMappingURL=index.js.map