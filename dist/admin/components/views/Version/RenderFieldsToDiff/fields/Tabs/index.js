"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const __1 = __importDefault(require("../.."));
const Nested_1 = __importDefault(require("../Nested"));
const baseClass = 'tabs-diff';
const Tabs = ({ version, comparison, permissions, field, locales, fieldComponents, }) => (react_1.default.createElement("div", { className: baseClass },
    react_1.default.createElement("div", { className: `${baseClass}__wrap` }, field.tabs.map((tab, i) => {
        if ('name' in tab) {
            return (react_1.default.createElement(Nested_1.default, { key: i, version: version === null || version === void 0 ? void 0 : version[tab.name], comparison: comparison === null || comparison === void 0 ? void 0 : comparison[tab.name], permissions: permissions, field: tab, locales: locales, fieldComponents: fieldComponents }));
        }
        return (react_1.default.createElement(__1.default, { key: i, locales: locales, version: version, comparison: comparison, fieldPermissions: permissions, fields: tab.fields, fieldComponents: fieldComponents }));
    }))));
exports.default = Tabs;
//# sourceMappingURL=index.js.map