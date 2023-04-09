"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const Config_1 = require("../../utilities/Config");
const RenderCustomComponent_1 = __importDefault(require("../../utilities/RenderCustomComponent"));
const LogOut_1 = __importDefault(require("../../icons/LogOut"));
const baseClass = 'nav';
const DefaultLogout = () => {
    const config = (0, Config_1.useConfig)();
    const { routes: { admin }, admin: { logoutRoute, components: { logout } } } = config;
    return (react_1.default.createElement(react_router_dom_1.Link, { to: `${admin}${logoutRoute}`, className: `${baseClass}__log-out` },
        react_1.default.createElement(LogOut_1.default, null)));
};
const Logout = () => {
    const { admin: { components: { logout: { Button: CustomLogout } = {
        Button: undefined,
    }, } = {}, } = {}, } = (0, Config_1.useConfig)();
    return (react_1.default.createElement(RenderCustomComponent_1.default, { CustomComponent: CustomLogout, DefaultComponent: DefaultLogout }));
};
exports.default = Logout;
//# sourceMappingURL=index.js.map