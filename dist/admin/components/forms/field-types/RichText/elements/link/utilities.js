"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withLinks = exports.wrapLink = exports.unwrapLink = void 0;
const slate_1 = require("slate");
const unwrapLink = (editor) => {
    slate_1.Transforms.unwrapNodes(editor, { match: (n) => slate_1.Element.isElement(n) && n.type === 'link' });
};
exports.unwrapLink = unwrapLink;
const wrapLink = (editor) => {
    const { selection } = editor;
    const isCollapsed = selection && slate_1.Range.isCollapsed(selection);
    const link = {
        type: 'link',
        url: undefined,
        newTab: false,
        children: isCollapsed ? [{ text: '' }] : [],
    };
    if (isCollapsed) {
        slate_1.Transforms.insertNodes(editor, link);
    }
    else {
        slate_1.Transforms.wrapNodes(editor, link, { split: true });
        slate_1.Transforms.collapse(editor, { edge: 'end' });
    }
};
exports.wrapLink = wrapLink;
const withLinks = (incomingEditor) => {
    const editor = incomingEditor;
    const { isInline } = editor;
    editor.isInline = (element) => {
        if (element.type === 'link') {
            return true;
        }
        return isInline(element);
    };
    return editor;
};
exports.withLinks = withLinks;
//# sourceMappingURL=utilities.js.map