"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const slate_1 = require("slate");
const isActive_1 = __importDefault(require("./isActive"));
const toggleLeaf = (editor, format) => {
    const isActive = (0, isActive_1.default)(editor, format);
    if (isActive) {
        slate_1.Editor.removeMark(editor, format);
    }
    else {
        slate_1.Editor.addMark(editor, format, true);
    }
};
exports.default = toggleLeaf;
//# sourceMappingURL=toggle.js.map