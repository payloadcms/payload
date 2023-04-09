"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectVoidElement = void 0;
const slate_1 = require("slate");
const isLastSelectedElementEmpty_1 = require("./isLastSelectedElementEmpty");
const injectVoidElement = (editor, element) => {
    const lastSelectedElementIsEmpty = (0, isLastSelectedElementEmpty_1.isLastSelectedElementEmpty)(editor);
    const previous = slate_1.Editor.previous(editor);
    if (lastSelectedElementIsEmpty) {
        // If previous node is void
        if (slate_1.Editor.isVoid(editor, previous === null || previous === void 0 ? void 0 : previous[0])) {
            // Insert a blank element between void nodes
            // so user can place cursor between void nodes
            slate_1.Transforms.insertNodes(editor, { children: [{ text: '' }] });
            slate_1.Transforms.setNodes(editor, element);
            // Otherwise just set the empty node equal to new void
        }
        else {
            slate_1.Transforms.setNodes(editor, element);
        }
    }
    else {
        slate_1.Transforms.insertNodes(editor, element);
    }
    // Add an empty node after the new void
    slate_1.Transforms.insertNodes(editor, { children: [{ text: '' }] });
};
exports.injectVoidElement = injectVoidElement;
//# sourceMappingURL=injectVoid.js.map