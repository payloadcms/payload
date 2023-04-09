"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastSelectedElementEmpty = void 0;
const slate_1 = require("slate");
const types_1 = require("../types");
const isLastSelectedElementEmpty = (editor) => {
    var _a, _b;
    if (!editor.selection)
        return false;
    const currentlySelectedNodes = Array.from(slate_1.Editor.nodes(editor, {
        at: slate_1.Editor.unhangRange(editor, editor.selection),
        match: (n) => !slate_1.Editor.isEditor(n) && slate_1.Element.isElement(n) && (!n.type || n.type === 'p'),
    }));
    const lastSelectedNode = currentlySelectedNodes === null || currentlySelectedNodes === void 0 ? void 0 : currentlySelectedNodes[(currentlySelectedNodes === null || currentlySelectedNodes === void 0 ? void 0 : currentlySelectedNodes.length) - 1];
    return lastSelectedNode && slate_1.Element.isElement(lastSelectedNode[0])
        && (!lastSelectedNode[0].type || lastSelectedNode[0].type === 'p')
        && (0, types_1.nodeIsTextNode)((_a = lastSelectedNode[0].children) === null || _a === void 0 ? void 0 : _a[0])
        && ((_b = lastSelectedNode[0].children) === null || _b === void 0 ? void 0 : _b[0].text) === '';
};
exports.isLastSelectedElementEmpty = isLastSelectedElementEmpty;
//# sourceMappingURL=isLastSelectedElementEmpty.js.map