"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Control = void 0;
const react_1 = __importDefault(require("react"));
const react_select_1 = require("react-select");
const Control = (props) => {
    const { children, innerProps, selectProps: { selectProps: { disableMouseDown, disableKeyDown, }, }, } = props;
    return (react_1.default.createElement(react_select_1.components.Control, { ...props, innerProps: {
            ...innerProps,
            onMouseDown: (e) => {
                // we need to prevent react-select from hijacking the 'onMouseDown' event while modals are open (i.e. the 'Relationship' field component)
                if (!disableMouseDown) {
                    innerProps.onMouseDown(e);
                }
            },
            // react-select has this typed incorrectly so we disable the linting rule
            // we need to prevent react-select from hijacking the 'onKeyDown' event while modals are open (i.e. the 'Relationship' field component)
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            onKeyDown: (e) => {
                if (disableKeyDown) {
                    e.stopPropagation();
                }
            },
        } }, children));
};
exports.Control = Control;
//# sourceMappingURL=index.js.map