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
const Auth_1 = require("../../utilities/Auth");
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const Button_1 = __importDefault(require("../../elements/Button"));
const Meta_1 = __importDefault(require("../../utilities/Meta"));
require("./index.scss");
const baseClass = 'logout';
const Logout = (props) => {
    const { inactivity } = props;
    const { logOut } = (0, Auth_1.useAuth)();
    const { routes: { admin } } = (0, Config_1.useConfig)();
    const { t } = (0, react_i18next_1.useTranslation)('authentication');
    (0, react_1.useEffect)(() => {
        logOut();
    }, [logOut]);
    return (react_1.default.createElement(Minimal_1.default, { className: baseClass },
        react_1.default.createElement(Meta_1.default, { title: t('logout'), description: t('logoutUser'), keywords: t('logout') }),
        react_1.default.createElement("div", { className: `${baseClass}__wrap` },
            inactivity && (react_1.default.createElement("h2", null, t('loggedOutInactivity'))),
            !inactivity && (react_1.default.createElement("h2", null, t('loggedOutSuccessfully'))),
            react_1.default.createElement("br", null),
            react_1.default.createElement(Button_1.default, { el: "anchor", buttonStyle: "secondary", url: `${admin}/login` }, t('logBackIn')))));
};
exports.default = Logout;
//# sourceMappingURL=index.js.map