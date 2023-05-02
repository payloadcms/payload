"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Config_1 = require("../../utilities/Config");
const RenderCustomComponent_1 = __importDefault(require("../../utilities/RenderCustomComponent"));
const css = `
  .graphic-icon path {
    fill: var(--theme-elevation-1000);
  }
`;
const PayloadIcon = () => (react_1.default.createElement("svg", { width: "25", height: "25", viewBox: "0 0 25 25", xmlns: "http://www.w3.org/2000/svg", className: "graphic-icon" },
    react_1.default.createElement("style", null, css),
    react_1.default.createElement("path", { d: "M11.5293 0L23 6.90096V19.9978L14.3608 25V11.9032L2.88452 5.00777L11.5293 0Z" }),
    react_1.default.createElement("path", { d: "M10.6559 24.2727V14.0518L2 19.0651L10.6559 24.2727Z" })));
const Icon = () => {
    const { admin: { components: { graphics: { Icon: CustomIcon, } = {
        Icon: undefined,
    }, } = {}, } = {}, } = (0, Config_1.useConfig)();
    return (react_1.default.createElement(RenderCustomComponent_1.default, { CustomComponent: CustomIcon, DefaultComponent: PayloadIcon }));
};
exports.default = Icon;
//# sourceMappingURL=index.js.map