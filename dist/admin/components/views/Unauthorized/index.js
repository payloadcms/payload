"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Button_1 = __importDefault(require("../../elements/Button"));
const Meta_1 = __importDefault(require("../../utilities/Meta"));
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const Unauthorized = () => {
    const { t } = (0, react_i18next_1.useTranslation)('general');
    const config = (0, Config_1.useConfig)();
    const { routes: { admin }, admin: { logoutRoute, }, } = config;
    return (react_1.default.createElement(Minimal_1.default, { className: "unauthorized" },
        react_1.default.createElement(Meta_1.default, { title: t('error:unauthorized'), description: t('error:unauthorized'), keywords: t('error:unauthorized') }),
        react_1.default.createElement("h2", null, t('error:unauthorized')),
        react_1.default.createElement("p", null, t('error:notAllowedToAccessPage')),
        react_1.default.createElement("br", null),
        react_1.default.createElement(Button_1.default, { el: "link", to: `${admin}${logoutRoute}` }, t('authentication:logOut'))));
};
exports.default = Unauthorized;
//# sourceMappingURL=index.js.map