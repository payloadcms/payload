"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const modal_1 = require("@faceless-ui/modal");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const Button_1 = __importDefault(require("../../elements/Button"));
require("./index.scss");
const baseClass = 'stay-logged-in';
const modalSlug = 'stay-logged-in';
const StayLoggedInModal = (props) => {
    const { refreshCookie } = props;
    const history = (0, react_router_dom_1.useHistory)();
    const config = (0, Config_1.useConfig)();
    const { routes: { admin }, admin: { logoutRoute } } = config;
    const { toggleModal } = (0, modal_1.useModal)();
    const { t } = (0, react_i18next_1.useTranslation)('authentication');
    return (react_1.default.createElement(modal_1.Modal, { className: baseClass, slug: "stay-logged-in" },
        react_1.default.createElement(Minimal_1.default, { className: `${baseClass}__template` },
            react_1.default.createElement("h1", null, t('stayLoggedIn')),
            react_1.default.createElement("p", null, t('youAreInactive')),
            react_1.default.createElement("div", { className: `${baseClass}__actions` },
                react_1.default.createElement(Button_1.default, { buttonStyle: "secondary", onClick: () => {
                        toggleModal(modalSlug);
                        history.push(`${admin}${logoutRoute}`);
                    } }, t('logOut')),
                react_1.default.createElement(Button_1.default, { onClick: () => {
                        refreshCookie();
                        toggleModal(modalSlug);
                    } }, t('stayLoggedIn'))))));
};
exports.default = StayLoggedInModal;
//# sourceMappingURL=index.js.map