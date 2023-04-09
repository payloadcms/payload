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
exports.useLocale = exports.LocaleProvider = void 0;
const react_1 = __importStar(require("react"));
const Config_1 = require("../Config");
const Auth_1 = require("../Auth");
const Preferences_1 = require("../Preferences");
const SearchParams_1 = require("../SearchParams");
const Context = (0, react_1.createContext)('');
const LocaleProvider = ({ children }) => {
    const { localization } = (0, Config_1.useConfig)();
    const { user } = (0, Auth_1.useAuth)();
    const defaultLocale = (localization && localization.defaultLocale) ? localization.defaultLocale : 'en';
    const searchParams = (0, SearchParams_1.useSearchParams)();
    const [locale, setLocale] = (0, react_1.useState)((searchParams === null || searchParams === void 0 ? void 0 : searchParams.locale) || defaultLocale);
    const { getPreference, setPreference } = (0, Preferences_1.usePreferences)();
    const localeFromParams = searchParams.locale;
    (0, react_1.useEffect)(() => {
        if (!localization) {
            return;
        }
        // set locale from search param
        if (localeFromParams && localization.locales.indexOf(localeFromParams) > -1) {
            setLocale(localeFromParams);
            if (user)
                setPreference('locale', localeFromParams);
            return;
        }
        // set locale from preferences or default
        (async () => {
            let preferenceLocale;
            let isPreferenceInConfig;
            if (user) {
                preferenceLocale = await getPreference('locale');
                isPreferenceInConfig = preferenceLocale && (localization.locales.indexOf(preferenceLocale) > -1);
                if (isPreferenceInConfig) {
                    setLocale(preferenceLocale);
                    return;
                }
                setPreference('locale', defaultLocale);
            }
            setLocale(defaultLocale);
        })();
    }, [defaultLocale, getPreference, localeFromParams, localization, setPreference, user]);
    return (react_1.default.createElement(Context.Provider, { value: locale }, children));
};
exports.LocaleProvider = LocaleProvider;
const useLocale = () => (0, react_1.useContext)(Context);
exports.useLocale = useLocale;
exports.default = Context;
//# sourceMappingURL=index.js.map