"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
require("./index.scss");
const baseClass = 'card';
const Card = (props) => {
    const { id, title, actions, onClick } = props;
    const classes = [
        baseClass,
        id,
        onClick && `${baseClass}--has-onclick`,
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("div", { className: classes, id: id },
        react_1.default.createElement("h5", null, title),
        actions && (react_1.default.createElement("div", { className: `${baseClass}__actions` }, actions)),
        onClick && (react_1.default.createElement(Button_1.default, { className: `${baseClass}__click`, buttonStyle: "none", onClick: onClick }))));
};
exports.default = Card;
//# sourceMappingURL=index.js.map