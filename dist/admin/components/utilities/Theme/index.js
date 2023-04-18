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
exports.useTheme = exports.ThemeProvider = void 0;
const react_1 = __importStar(require("react"));
const initialContext = {
    theme: 'light',
    setTheme: () => null,
    autoMode: true,
};
const Context = (0, react_1.createContext)(initialContext);
const localStorageKey = 'payload-theme';
const getTheme = () => {
    let theme;
    const themeFromStorage = window.localStorage.getItem(localStorageKey);
    if (themeFromStorage === 'light' || themeFromStorage === 'dark') {
        theme = themeFromStorage;
    }
    else {
        theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    return theme;
};
const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = (0, react_1.useState)(getTheme);
    const [autoMode, setAutoMode] = (0, react_1.useState)(() => {
        const themeFromStorage = window.localStorage.getItem(localStorageKey);
        return !themeFromStorage;
    });
    const setTheme = (0, react_1.useCallback)((themeToSet) => {
        if (themeToSet === 'light' || themeToSet === 'dark') {
            setThemeState(themeToSet);
            setAutoMode(false);
            window.localStorage.setItem(localStorageKey, themeToSet);
            document.documentElement.setAttribute('data-theme', themeToSet);
        }
        else if (themeToSet === 'auto') {
            const existingThemeFromStorage = window.localStorage.getItem(localStorageKey);
            if (existingThemeFromStorage)
                window.localStorage.removeItem(localStorageKey);
            const themeFromOS = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', themeFromOS);
            setAutoMode(true);
            setThemeState(themeFromOS);
        }
    }, []);
    return (react_1.default.createElement(Context.Provider, { value: { theme, setTheme, autoMode } }, children));
};
exports.ThemeProvider = ThemeProvider;
const useTheme = () => (0, react_1.useContext)(Context);
exports.useTheme = useTheme;
exports.default = Context;
//# sourceMappingURL=index.js.map