"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const slate_1 = require("slate");
const isLeafActive = (editor, format) => {
    const leaves = slate_1.Editor.marks(editor);
    return leaves ? leaves[format] === true : false;
};
exports.default = isLeafActive;
//# sourceMappingURL=isActive.js.map