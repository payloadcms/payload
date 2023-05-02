"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const slate_1 = require("slate");
const isElementActive = (editor, format) => {
    if (!editor.selection)
        return false;
    const [match] = Array.from(slate_1.Editor.nodes(editor, {
        at: slate_1.Editor.unhangRange(editor, editor.selection),
        match: (n) => !slate_1.Editor.isEditor(n) && slate_1.Element.isElement(n) && n.type === format,
    }));
    return !!match;
};
exports.default = isElementActive;
//# sourceMappingURL=isActive.js.map