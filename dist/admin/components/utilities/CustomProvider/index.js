"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomProvider = void 0;
const react_1 = __importDefault(require("react"));
const Config_1 = require("../Config");
const NestProviders = ({ providers, children }) => {
    const Component = providers[0];
    if (providers.length > 1) {
        return (react_1.default.createElement(Component, null,
            react_1.default.createElement(NestProviders, { providers: providers.slice(1) }, children)));
    }
    return (react_1.default.createElement(Component, null, children));
};
const CustomProvider = ({ children }) => {
    const config = (0, Config_1.useConfig)();
    const { admin: { components: { providers, }, }, } = config;
    if (Array.isArray(providers) && providers.length > 0) {
        return (react_1.default.createElement(NestProviders, { providers: providers }, children));
    }
    return (react_1.default.createElement(react_1.default.Fragment, null, children));
};
exports.CustomProvider = CustomProvider;
//# sourceMappingURL=index.js.map