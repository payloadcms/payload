"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Nav_1 = __importDefault(require("../../elements/Nav"));
const RenderCustomComponent_1 = __importDefault(require("../../utilities/RenderCustomComponent"));
const Meta_1 = __importDefault(require("../../utilities/Meta"));
require("./index.scss");
const baseClass = 'template-default';
const Default = ({ children, className }) => {
    const { admin: { components: { Nav: CustomNav, } = {
        Nav: undefined,
    }, } = {}, } = (0, Config_1.useConfig)();
    const { t } = (0, react_i18next_1.useTranslation)('general');
    const classes = [
        baseClass,
        className,
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("div", { className: classes },
        react_1.default.createElement(Meta_1.default, { title: t('dashboard'), description: `${t('dashboard')} Payload CMS`, keywords: `${t('dashboard')}, Payload CMS` }),
        react_1.default.createElement(RenderCustomComponent_1.default, { DefaultComponent: Nav_1.default, CustomComponent: CustomNav }),
        react_1.default.createElement("div", { className: `${baseClass}__wrap` }, children)));
};
exports.default = Default;
//# sourceMappingURL=index.js.map