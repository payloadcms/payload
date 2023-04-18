"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Auth_1 = require("../../utilities/Auth");
const Logo_1 = __importDefault(require("../../graphics/Logo"));
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const Form_1 = __importDefault(require("../../forms/Form"));
const Email_1 = __importDefault(require("../../forms/field-types/Email"));
const Password_1 = __importDefault(require("../../forms/field-types/Password"));
const Submit_1 = __importDefault(require("../../forms/Submit"));
const Button_1 = __importDefault(require("../../elements/Button"));
const Meta_1 = __importDefault(require("../../utilities/Meta"));
const Loading_1 = require("../../elements/Loading");
require("./index.scss");
const baseClass = 'login';
const Login = () => {
    const history = (0, react_router_dom_1.useHistory)();
    const { t } = (0, react_i18next_1.useTranslation)('authentication');
    const { user, setToken } = (0, Auth_1.useAuth)();
    const config = (0, Config_1.useConfig)();
    const { admin: { user: userSlug, logoutRoute, components: { beforeLogin, afterLogin, } = {}, }, serverURL, routes: { admin, api, }, collections, } = config;
    const collection = collections.find(({ slug }) => slug === userSlug);
    const onSuccess = (data) => {
        if (data.token) {
            setToken(data.token);
            history.push(admin);
        }
    };
    return (react_1.default.createElement(react_1.default.Fragment, null, user ? (
    // Logout
    react_1.default.createElement(Minimal_1.default, { className: baseClass },
        react_1.default.createElement(Meta_1.default, { title: t('login'), description: t('loginUser'), keywords: t('login') }),
        react_1.default.createElement("div", { className: `${baseClass}__wrap` },
            react_1.default.createElement("h1", null, t('alreadyLoggedIn')),
            react_1.default.createElement("p", null,
                react_1.default.createElement(react_i18next_1.Trans, { i18nKey: "loggedIn", t: t },
                    react_1.default.createElement(react_router_dom_1.Link, { to: `${admin}${logoutRoute}` }, t('logOut')))),
            react_1.default.createElement("br", null),
            react_1.default.createElement(Button_1.default, { el: "link", buttonStyle: "secondary", to: admin }, t('general:backToDashboard'))))) : (
    // Login
    react_1.default.createElement(Minimal_1.default, { className: baseClass },
        react_1.default.createElement(Meta_1.default, { title: t('login'), description: t('loginUser'), keywords: t('login') }),
        react_1.default.createElement("div", { className: `${baseClass}__brand` },
            react_1.default.createElement(Logo_1.default, null)),
        Array.isArray(beforeLogin) && beforeLogin.map((Component, i) => react_1.default.createElement(Component, { key: i })),
        !collection.auth.disableLocalStrategy && (react_1.default.createElement(Form_1.default, { disableSuccessStatus: true, waitForAutocomplete: true, onSuccess: onSuccess, method: "post", action: `${serverURL}${api}/${userSlug}/login` },
            react_1.default.createElement(Loading_1.FormLoadingOverlayToggle, { action: "loading", name: "login-form" }),
            react_1.default.createElement(Email_1.default, { label: t('general:email'), name: "email", admin: { autoComplete: 'email' }, required: true }),
            react_1.default.createElement(Password_1.default, { label: t('general:password'), name: "password", autoComplete: "off", required: true }),
            react_1.default.createElement(react_router_dom_1.Link, { to: `${admin}/forgot` }, t('forgotPasswordQuestion')),
            react_1.default.createElement(Submit_1.default, null, t('login')))),
        Array.isArray(afterLogin) && afterLogin.map((Component, i) => react_1.default.createElement(Component, { key: i }))))));
};
exports.default = Login;
//# sourceMappingURL=index.js.map