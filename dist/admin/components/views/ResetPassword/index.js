"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const react_toastify_1 = require("react-toastify");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Auth_1 = require("../../utilities/Auth");
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const Form_1 = __importDefault(require("../../forms/Form"));
const Password_1 = __importDefault(require("../../forms/field-types/Password"));
const ConfirmPassword_1 = __importDefault(require("../../forms/field-types/ConfirmPassword"));
const Submit_1 = __importDefault(require("../../forms/Submit"));
const Button_1 = __importDefault(require("../../elements/Button"));
const Meta_1 = __importDefault(require("../../utilities/Meta"));
const HiddenInput_1 = __importDefault(require("../../forms/field-types/HiddenInput"));
require("./index.scss");
const baseClass = 'reset-password';
const ResetPassword = () => {
    const config = (0, Config_1.useConfig)();
    const { admin: { user: userSlug, logoutRoute }, serverURL, routes: { admin, api } } = config;
    const { token } = (0, react_router_dom_1.useParams)();
    const history = (0, react_router_dom_1.useHistory)();
    const { user, setToken } = (0, Auth_1.useAuth)();
    const { t } = (0, react_i18next_1.useTranslation)('authentication');
    const onSuccess = (data) => {
        if (data.token) {
            setToken(data.token);
            history.push(`${admin}`);
        }
        else {
            history.push(`${admin}/login`);
            react_toastify_1.toast.success(t('general:updatedSuccessfully'), { autoClose: 3000 });
        }
    };
    if (user) {
        return (react_1.default.createElement(Minimal_1.default, { className: baseClass },
            react_1.default.createElement(Meta_1.default, { title: t('resetPassword'), description: t('resetPassword'), keywords: t('resetPassword') }),
            react_1.default.createElement("div", { className: `${baseClass}__wrap` },
                react_1.default.createElement("h1", null, t('alreadyLoggedIn')),
                react_1.default.createElement("p", null,
                    react_1.default.createElement(react_i18next_1.Trans, { i18nKey: "loginWithAnotherUser", t: t },
                        react_1.default.createElement(react_router_dom_1.Link, { to: `${admin}${logoutRoute}` }, "log out"))),
                react_1.default.createElement("br", null),
                react_1.default.createElement(Button_1.default, { el: "link", buttonStyle: "secondary", to: admin }, t('general:backToDashboard')))));
    }
    return (react_1.default.createElement(Minimal_1.default, { className: baseClass },
        react_1.default.createElement("div", { className: `${baseClass}__wrap` },
            react_1.default.createElement("h1", null, t('resetPassword')),
            react_1.default.createElement(Form_1.default, { onSuccess: onSuccess, method: "post", action: `${serverURL}${api}/${userSlug}/reset-password`, redirect: admin },
                react_1.default.createElement(Password_1.default, { label: t('newPassword'), name: "password", autoComplete: "off", required: true }),
                react_1.default.createElement(ConfirmPassword_1.default, null),
                react_1.default.createElement(HiddenInput_1.default, { name: "token", value: token }),
                react_1.default.createElement(Submit_1.default, null, t('resetPassword'))))));
};
exports.default = ResetPassword;
//# sourceMappingURL=index.js.map