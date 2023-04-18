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
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Eyebrow_1 = __importDefault(require("../../elements/Eyebrow"));
const StepNav_1 = require("../../elements/StepNav");
const Button_1 = __importDefault(require("../../elements/Button"));
const Meta_1 = __importDefault(require("../../utilities/Meta"));
const Gutter_1 = require("../../elements/Gutter");
const baseClass = 'not-found';
const NotFound = () => {
    const { setStepNav } = (0, StepNav_1.useStepNav)();
    const { routes: { admin } } = (0, Config_1.useConfig)();
    const { t } = (0, react_i18next_1.useTranslation)('general');
    (0, react_1.useEffect)(() => {
        setStepNav([{
                label: t('notFound'),
            }]);
    }, [setStepNav, t]);
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(Meta_1.default, { title: t('notFound'), description: t('pageNotFound'), keywords: `404 ${t('notFound')}` }),
        react_1.default.createElement(Eyebrow_1.default, null),
        react_1.default.createElement(Gutter_1.Gutter, { className: `${baseClass}__wrap` },
            react_1.default.createElement("h1", null, t('nothingFound')),
            react_1.default.createElement("p", null, t('sorryNotFound')),
            react_1.default.createElement(Button_1.default, { el: "link", to: `${admin}` }, t('backToDashboard')))));
};
exports.default = NotFound;
//# sourceMappingURL=index.js.map