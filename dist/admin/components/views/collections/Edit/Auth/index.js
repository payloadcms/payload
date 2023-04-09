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
const react_toastify_1 = require("react-toastify");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../../../utilities/Config");
const Email_1 = __importDefault(require("../../../../forms/field-types/Email"));
const Password_1 = __importDefault(require("../../../../forms/field-types/Password"));
const Checkbox_1 = __importDefault(require("../../../../forms/field-types/Checkbox"));
const Button_1 = __importDefault(require("../../../../elements/Button"));
const ConfirmPassword_1 = __importDefault(require("../../../../forms/field-types/ConfirmPassword"));
const context_1 = require("../../../../forms/Form/context");
const APIKey_1 = __importDefault(require("./APIKey"));
require("./index.scss");
const baseClass = 'auth-fields';
const Auth = (props) => {
    const { useAPIKey, requirePassword, verify, collection: { slug }, collection, email, operation } = props;
    const [changingPassword, setChangingPassword] = (0, react_1.useState)(requirePassword);
    const enableAPIKey = (0, context_1.useFormFields)(([fields]) => fields.enableAPIKey);
    const dispatchFields = (0, context_1.useFormFields)((reducer) => reducer[1]);
    const modified = (0, context_1.useFormModified)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('authentication');
    const { serverURL, routes: { api, }, } = (0, Config_1.useConfig)();
    const handleChangePassword = (0, react_1.useCallback)(async (state) => {
        if (!state) {
            dispatchFields({ type: 'REMOVE', path: 'password' });
            dispatchFields({ type: 'REMOVE', path: 'confirm-password' });
        }
        setChangingPassword(state);
    }, [dispatchFields]);
    const unlock = (0, react_1.useCallback)(async () => {
        const url = `${serverURL}${api}/${slug}/unlock`;
        const response = await fetch(url, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': i18n.language,
            },
            body: JSON.stringify({
                email,
            }),
            method: 'post',
        });
        if (response.status === 200) {
            react_toastify_1.toast.success(t('successfullyUnlocked'), { autoClose: 3000 });
        }
        else {
            react_toastify_1.toast.error(t('failedToUnlock'));
        }
    }, [i18n, serverURL, api, slug, email, t]);
    (0, react_1.useEffect)(() => {
        if (!modified) {
            setChangingPassword(false);
        }
    }, [modified]);
    if (collection.auth.disableLocalStrategy && !collection.auth.useAPIKey) {
        return null;
    }
    return (react_1.default.createElement("div", { className: baseClass },
        !collection.auth.disableLocalStrategy && (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Email_1.default, { required: true, name: "email", label: t('general:email'), admin: { autoComplete: 'email' } }),
            (changingPassword || requirePassword) && (react_1.default.createElement("div", { className: `${baseClass}__changing-password` },
                react_1.default.createElement(Password_1.default, { autoComplete: "off", required: true, name: "password", label: t('newPassword') }),
                react_1.default.createElement(ConfirmPassword_1.default, null),
                !requirePassword && (react_1.default.createElement(Button_1.default, { size: "small", buttonStyle: "secondary", onClick: () => handleChangePassword(false) }, t('general:cancel'))))),
            (!changingPassword && !requirePassword) && (react_1.default.createElement(Button_1.default, { id: "change-password", size: "small", buttonStyle: "secondary", onClick: () => handleChangePassword(true) }, t('changePassword'))),
            operation === 'update' && (react_1.default.createElement(Button_1.default, { size: "small", buttonStyle: "secondary", onClick: () => unlock() }, t('forceUnlock'))))),
        useAPIKey && (react_1.default.createElement("div", { className: `${baseClass}__api-key` },
            react_1.default.createElement(Checkbox_1.default, { label: t('enableAPIKey'), name: "enableAPIKey" }),
            (enableAPIKey === null || enableAPIKey === void 0 ? void 0 : enableAPIKey.value) && (react_1.default.createElement(APIKey_1.default, null)))),
        verify && (react_1.default.createElement(Checkbox_1.default, { label: t('verified'), name: "_verified" }))));
};
exports.default = Auth;
//# sourceMappingURL=index.js.map