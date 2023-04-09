"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommonBlock = void 0;
const slate_1 = require("slate");
const getCommonBlock = (editor, match) => {
    const range = slate_1.Editor.unhangRange(editor, editor.selection, { voids: true });
    const [common, path] = slate_1.Node.common(editor, range.anchor.path, range.focus.path);
    if (slate_1.Editor.isBlock(editor, common) || slate_1.Editor.isEditor(common)) {
        return [common, path];
    }
    return slate_1.Editor.above(editor, {
        at: path,
        match: match || ((n) => slate_1.Editor.isBlock(editor, n) || slate_1.Editor.isEditor(n)),
    });
};
exports.getCommonBlock = getCommonBlock;
//# sourceMappingURL=getCommonBlock.js.map