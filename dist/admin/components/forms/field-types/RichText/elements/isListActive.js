"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const slate_1 = require("slate");
const getCommonBlock_1 = require("./getCommonBlock");
const isListActive = (editor, format) => {
    if (!editor.selection)
        return false;
    const [topmostSelectedNode, topmostSelectedNodePath] = (0, getCommonBlock_1.getCommonBlock)(editor);
    if (slate_1.Editor.isEditor(topmostSelectedNode))
        return false;
    const [match] = Array.from(slate_1.Editor.nodes(editor, {
        at: topmostSelectedNodePath,
        mode: 'lowest',
        match: (node, path) => {
            return !slate_1.Editor.isEditor(node)
                && slate_1.Element.isElement(node)
                && node.type === format
                && path.length >= topmostSelectedNodePath.length - 2;
        },
    }));
    return !!match;
};
exports.default = isListActive;
//# sourceMappingURL=isListActive.js.map