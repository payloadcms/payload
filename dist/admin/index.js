"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - need to do this because this file doesn't actually exist
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const Root_1 = __importDefault(require("./Root"));
const container = document.getElementById('app');
const root = (0, client_1.createRoot)(container); // createRoot(container!) if you use TypeScript
root.render(react_1.default.createElement(Root_1.default, null));
// Needed for Hot Module Replacement
if (typeof (module.hot) !== 'undefined') {
    module.hot.accept();
}
//# sourceMappingURL=index.js.map