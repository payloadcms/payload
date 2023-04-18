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
exports.useStepNav = exports.StepNavProvider = void 0;
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const react_i18next_1 = require("react-i18next");
const Chevron_1 = __importDefault(require("../../icons/Chevron"));
const getTranslation_1 = require("../../../../utilities/getTranslation");
const Config_1 = require("../../utilities/Config");
require("./index.scss");
const Context = (0, react_1.createContext)({});
const StepNavProvider = ({ children }) => {
    const [stepNav, setStepNav] = (0, react_1.useState)([]);
    return (react_1.default.createElement(Context.Provider, { value: {
            stepNav,
            setStepNav,
        } }, children));
};
exports.StepNavProvider = StepNavProvider;
const useStepNav = () => (0, react_1.useContext)(Context);
exports.useStepNav = useStepNav;
const StepNav = () => {
    const { t, i18n } = (0, react_i18next_1.useTranslation)();
    const dashboardLabel = react_1.default.createElement("span", null, t('general:dashboard'));
    const { stepNav } = useStepNav();
    const config = (0, Config_1.useConfig)();
    const { routes: { admin } } = config;
    return (react_1.default.createElement("nav", { className: "step-nav" },
        stepNav.length > 0
            ? (react_1.default.createElement(react_router_dom_1.Link, { to: admin },
                dashboardLabel,
                react_1.default.createElement(Chevron_1.default, null)))
            : dashboardLabel,
        stepNav.map((item, i) => {
            const StepLabel = react_1.default.createElement("span", { key: i }, (0, getTranslation_1.getTranslation)(item.label, i18n));
            const Step = stepNav.length === i + 1
                ? StepLabel
                : (react_1.default.createElement(react_router_dom_1.Link, { to: item.url, key: i },
                    StepLabel,
                    react_1.default.createElement(Chevron_1.default, null)));
            return Step;
        })));
};
exports.default = StepNav;
//# sourceMappingURL=index.js.map