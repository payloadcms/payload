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
const react_animate_height_1 = __importDefault(require("react-animate-height"));
const Chevron_1 = __importDefault(require("../../icons/Chevron"));
const Preferences_1 = require("../../utilities/Preferences");
require("./index.scss");
const baseClass = 'nav-group';
const NavGroup = ({ children, label, }) => {
    const [collapsed, setCollapsed] = (0, react_1.useState)(true);
    const [animate, setAnimate] = (0, react_1.useState)(false);
    const { getPreference, setPreference } = (0, Preferences_1.usePreferences)();
    const preferencesKey = `collapsed-${label}-groups`;
    (0, react_1.useEffect)(() => {
        if (label) {
            const setCollapsedFromPreferences = async () => {
                const preferences = await getPreference(preferencesKey) || [];
                setCollapsed(preferences.indexOf(label) !== -1);
            };
            setCollapsedFromPreferences();
        }
    }, [getPreference, label, preferencesKey]);
    if (label) {
        const toggleCollapsed = async () => {
            setAnimate(true);
            let preferences = await getPreference(preferencesKey) || [];
            if (collapsed) {
                preferences = preferences.filter((preference) => label !== preference);
            }
            else {
                preferences.push(label);
            }
            setPreference(preferencesKey, preferences);
            setCollapsed(!collapsed);
        };
        return (react_1.default.createElement("div", { id: `nav-group-${label}`, className: [
                `${baseClass}`,
                `${label}`,
                collapsed && `${baseClass}--collapsed`,
            ].filter(Boolean)
                .join(' ') },
            react_1.default.createElement("button", { type: "button", className: [
                    `${baseClass}__toggle`,
                    `${baseClass}__toggle--${collapsed ? 'collapsed' : 'open'}`,
                ].filter(Boolean)
                    .join(' '), onClick: toggleCollapsed },
                react_1.default.createElement("div", { className: `${baseClass}__label` }, label),
                react_1.default.createElement(Chevron_1.default, { className: `${baseClass}__indicator` })),
            react_1.default.createElement(react_animate_height_1.default, { height: collapsed ? 0 : 'auto', duration: animate ? 200 : 0 },
                react_1.default.createElement("div", { className: `${baseClass}__content` }, children))));
    }
    return (react_1.default.createElement(react_1.default.Fragment, null, children));
};
exports.default = NavGroup;
//# sourceMappingURL=index.js.map