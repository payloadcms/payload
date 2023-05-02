"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withRelationship = (incomingEditor) => {
    const editor = incomingEditor;
    const { isVoid } = editor;
    editor.isVoid = (element) => (element.type === 'upload' ? true : isVoid(element));
    return editor;
};
exports.default = withRelationship;
//# sourceMappingURL=plugin.js.map