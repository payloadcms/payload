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
exports.usePreferences = exports.PreferencesProvider = void 0;
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../Config");
const Auth_1 = require("../Auth");
const api_1 = require("../../../api");
const Context = (0, react_1.createContext)({});
const requestOptions = (value, language) => ({
    body: JSON.stringify({ value }),
    headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language,
    },
});
const PreferencesProvider = ({ children }) => {
    const contextRef = (0, react_1.useRef)({});
    const preferencesRef = (0, react_1.useRef)({});
    const config = (0, Config_1.useConfig)();
    const { user } = (0, Auth_1.useAuth)();
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const { serverURL, routes: { api } } = config;
    (0, react_1.useEffect)(() => {
        if (!user) {
            // clear preferences between users
            preferencesRef.current = {};
        }
    }, [user]);
    const getPreference = (0, react_1.useCallback)(async (key) => {
        const prefs = preferencesRef.current;
        if (typeof prefs[key] !== 'undefined')
            return prefs[key];
        const promise = new Promise((resolve) => {
            (async () => {
                const request = await api_1.requests.get(`${serverURL}${api}/_preferences/${key}`, {
                    headers: {
                        'Accept-Language': i18n.language,
                    },
                });
                let value = null;
                if (request.status === 200) {
                    const preference = await request.json();
                    value = preference.value;
                }
                preferencesRef.current[key] = value;
                resolve(value);
            })();
        });
        prefs[key] = promise;
        return promise;
    }, [i18n.language, api, preferencesRef, serverURL]);
    const setPreference = (0, react_1.useCallback)(async (key, value) => {
        preferencesRef.current[key] = value;
        await api_1.requests.post(`${serverURL}${api}/_preferences/${key}`, requestOptions(value, i18n.language));
    }, [api, i18n.language, serverURL]);
    contextRef.current.getPreference = getPreference;
    contextRef.current.setPreference = setPreference;
    return (react_1.default.createElement(Context.Provider, { value: contextRef.current }, children));
};
exports.PreferencesProvider = PreferencesProvider;
const usePreferences = () => (0, react_1.useContext)(Context);
exports.usePreferences = usePreferences;
//# sourceMappingURL=index.js.map