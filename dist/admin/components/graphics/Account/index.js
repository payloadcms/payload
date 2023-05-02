"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Auth_1 = require("../../utilities/Auth");
const Config_1 = require("../../utilities/Config");
const Gravatar_1 = __importDefault(require("./Gravatar"));
const css = `
  .graphic-account .circle1 {
    fill: var(--theme-elevation-100);
  }

  .graphic-account .circle2, .graphic-account path {
    fill: var(--theme-elevation-300);
  }
`;
const Default = () => (react_1.default.createElement("svg", { className: "graphic-account", width: "25", height: "25", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 25 25" },
    react_1.default.createElement("style", null, css),
    react_1.default.createElement("circle", { className: "circle1", cx: "12.5", cy: "12.5", r: "11.5" }),
    react_1.default.createElement("circle", { className: "circle2", cx: "12.5", cy: "10.73", r: "3.98" }),
    react_1.default.createElement("path", { d: "M12.5,24a11.44,11.44,0,0,0,7.66-2.94c-.5-2.71-3.73-4.8-7.66-4.8s-7.16,2.09-7.66,4.8A11.44,11.44,0,0,0,12.5,24Z" })));
const Account = () => {
    const { admin: { avatar: Avatar }, } = (0, Config_1.useConfig)();
    const { user } = (0, Auth_1.useAuth)();
    if (!user.email || Avatar === 'default')
        return react_1.default.createElement(Default, null);
    if (Avatar === 'gravatar')
        return react_1.default.createElement(Gravatar_1.default, null);
    if (Avatar)
        return react_1.default.createElement(Avatar, null);
    return react_1.default.createElement(Default, null);
};
exports.default = Account;
function isClassComponent(component) {
    return typeof component === 'function' && !!component.prototype.isReactComponent;
}
function isFunctionComponent(component) {
    return typeof component === 'function' && String(component).includes('return React.createElement');
}
function isReactComponent(component) {
    return isClassComponent(component) || isFunctionComponent(component);
}
//# sourceMappingURL=index.js.map