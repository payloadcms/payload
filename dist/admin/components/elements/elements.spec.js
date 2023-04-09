"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
const Separator_1 = __importDefault(require("./Paginator/Separator"));
describe('Elements', () => {
    describe('Paginator', () => {
        it('separator - renders dash', () => {
            const { getByText } = (0, react_2.render)(react_1.default.createElement(Separator_1.default, null));
            const linkElement = getByText(/—/i); // &mdash;
            expect(linkElement).toBeInTheDocument();
        });
    });
});
//# sourceMappingURL=elements.spec.js.map