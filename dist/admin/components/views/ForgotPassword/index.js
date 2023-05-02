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
const react_router_dom_1 = require("react-router-dom");
const react_toastify_1 = require("react-toastify");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Auth_1 = require("../../utilities/Auth");
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const Form_1 = __importDefault(require("../../forms/Form"));
const Email_1 = __importDefault(require("../../forms/field-types/Email"));
const Submit_1 = __importDefault(require("../../forms/Submit"));
const Button_1 = __importDefault(require("../../elements/Button"));
const Meta_1 = __importDefault(require("../../utilities/Meta"));
require("./index.scss");
const baseClass = 'forgot-password';
const ForgotPassword = () => {
    const [hasSubmitted, setHasSubmitted] = (0, react_1.useState)(false);
    const { user } = (0, Auth_1.useAuth)();
    const { t } = (0, react_i18next_1.useTranslation)('authentication');
    const { admin: { user: userSlug }, serverURL, routes: { admin, api, }, } = (0, Config_1.useConfig)();
    const handleResponse = (res) => {
        res.json()
            .then(() => {
            setHasSubmitted(true);
        }, () => {
            react_toastify_1.toast.error(t('emailNotValid'));
        });
    };
    if (user) {
        return (react_1.default.createElement(Minimal_1.default, { className: baseClass },
            react_1.default.createElement(Meta_1.default, { title: t('forgotPassword'), description: t('forgotPassword'), keywords: t('forgotPassword') }),
            react_1.default.createElement("h1", null, t('alreadyLoggedIn')),
            react_1.default.createElement("p", null,
                react_1.default.createElement(react_i18next_1.Trans, { i18nKey: "loggedInChangePassword", t: t },
                    react_1.default.createElement(react_router_dom_1.Link, { to: `${admin}/account` }, "account"))),
            react_1.default.createElement("br", null),
            react_1.default.createElement(Button_1.default, { el: "link", buttonStyle: "secondary", to: admin }, t('general:backToDashboard'))));
    }
    if (hasSubmitted) {
        return (react_1.default.createElement(Minimal_1.default, { className: baseClass },
            react_1.default.createElement("h1", null, t('emailSent')),
            react_1.default.createElement("p", null, t('checkYourEmailForPasswordReset'))));
    }
    return (react_1.default.createElement(Minimal_1.default, { className: baseClass },
        react_1.default.createElement(Form_1.default, { handleResponse: handleResponse, method: "post", action: `${serverURL}${api}/${userSlug}/forgot-password` },
            react_1.default.createElement("h1", null, t('forgotPassword')),
            react_1.default.createElement("p", null, t('forgotPasswordEmailInstructions')),
            react_1.default.createElement(Email_1.default, { label: t('general:emailAddress'), name: "email", admin: { autoComplete: 'email' }, required: true }),
            react_1.default.createElement(Submit_1.default, null, t('general:submit'))),
        react_1.default.createElement(react_router_dom_1.Link, { to: `${admin}/login` }, t('backToLogin'))));
};
exports.default = ForgotPassword;
//# sourceMappingURL=index.js.map