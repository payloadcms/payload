"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWithinListItem = void 0;
const slate_1 = require("slate");
const isWithinListItem = (editor) => {
    var _a;
    let parentLI;
    try {
        parentLI = slate_1.Editor.parent(editor, editor.selection);
    }
    catch (e) {
        // swallow error, Slate
    }
    if (slate_1.Element.isElement(parentLI === null || parentLI === void 0 ? void 0 : parentLI[0]) && ((_a = parentLI === null || parentLI === void 0 ? void 0 : parentLI[0]) === null || _a === void 0 ? void 0 : _a.type) === 'li') {
        return true;
    }
    return false;
};
exports.isWithinListItem = isWithinListItem;
//# sourceMappingURL=isWithinListItem.js.map