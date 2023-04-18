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
const react_router_dom_1 = require("react-router-dom");
const Config_1 = require("../../utilities/Config");
const Auth_1 = require("../../utilities/Auth");
const Logo_1 = __importDefault(require("../../graphics/Logo"));
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const Button_1 = __importDefault(require("../../elements/Button"));
const Meta_1 = __importDefault(require("../../utilities/Meta"));
const Login_1 = __importDefault(require("../Login"));
require("./index.scss");
const baseClass = 'verify';
const Verify = ({ collection }) => {
    const { slug: collectionSlug } = collection;
    const { user } = (0, Auth_1.useAuth)();
    const { token } = (0, react_router_dom_1.useParams)();
    const { serverURL, routes: { admin: adminRoute }, admin: { user: adminUser } } = (0, Config_1.useConfig)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('authentication');
    const isAdminUser = collectionSlug === adminUser;
    const [verifyResult, setVerifyResult] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        async function verifyToken() {
            const result = await fetch(`${serverURL}/api/${collectionSlug}/verify/${token}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept-Language': i18n.language,
                },
            });
            setVerifyResult(result);
        }
        verifyToken();
    }, [setVerifyResult, collectionSlug, serverURL, token, i18n]);
    if (user) {
        return react_1.default.createElement(Login_1.default, null);
    }
    const getText = () => {
        if ((verifyResult === null || verifyResult === void 0 ? void 0 : verifyResult.status) === 200)
            return t('verifiedSuccessfully');
        if ((verifyResult === null || verifyResult === void 0 ? void 0 : verifyResult.status) === 202)
            return t('alreadyActivated');
        return t('unableToVerify');
    };
    return (react_1.default.createElement(Minimal_1.default, { className: baseClass },
        react_1.default.createElement(Meta_1.default, { title: t('verify'), description: t('verifyUser'), keywords: t('verify') }),
        react_1.default.createElement("div", { className: `${baseClass}__brand` },
            react_1.default.createElement(Logo_1.default, null)),
        react_1.default.createElement("h2", null, getText()),
        isAdminUser && (verifyResult === null || verifyResult === void 0 ? void 0 : verifyResult.status) === 200 && (react_1.default.createElement(Button_1.default, { el: "link", buttonStyle: "secondary", to: `${adminRoute}/login` }, t('login')))));
};
exports.default = Verify;
//# sourceMappingURL=index.js.map