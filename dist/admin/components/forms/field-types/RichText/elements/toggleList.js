"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const slate_1 = require("slate");
const slate_react_1 = require("slate-react");
const getCommonBlock_1 = require("./getCommonBlock");
const isListActive_1 = __importDefault(require("./isListActive"));
const listTypes_1 = __importDefault(require("./listTypes"));
const unwrapList_1 = require("./unwrapList");
const toggleList = (editor, format) => {
    let currentListFormat;
    if ((0, isListActive_1.default)(editor, 'ol'))
        currentListFormat = 'ol';
    if ((0, isListActive_1.default)(editor, 'ul'))
        currentListFormat = 'ul';
    // If the format is currently active,
    // remove the list
    if (currentListFormat === format) {
        const selectedLeaf = slate_1.Node.descendant(editor, editor.selection.anchor.path);
        // If on an empty bullet, leave the above list alone
        // and unwrap only the active bullet
        if (slate_1.Text.isText(selectedLeaf) && String(selectedLeaf.text).length === 0) {
            slate_1.Transforms.unwrapNodes(editor, {
                match: (n) => slate_1.Element.isElement(n) && listTypes_1.default.includes(n.type),
                split: true,
                mode: 'lowest',
            });
            slate_1.Transforms.setNodes(editor, { type: undefined });
        }
        else {
            // Otherwise, we need to unset li on all lis in the parent list
            // and unwrap the parent list itself
            const [, listPath] = (0, getCommonBlock_1.getCommonBlock)(editor, (n) => slate_1.Element.isElement(n) && n.type === format);
            (0, unwrapList_1.unwrapList)(editor, listPath);
        }
        // Otherwise, if a list is active and we are changing it,
        // change it
    }
    else if (currentListFormat && currentListFormat !== format) {
        slate_1.Transforms.setNodes(editor, {
            type: format,
        }, {
            match: (node) => slate_1.Element.isElement(node) && listTypes_1.default.includes(node.type),
            mode: 'lowest',
        });
        // Otherwise we can assume that we should just activate the list
    }
    else {
        slate_1.Transforms.wrapNodes(editor, { type: format, children: [] });
        const [, parentNodePath] = (0, getCommonBlock_1.getCommonBlock)(editor, (node) => slate_1.Element.isElement(node) && node.type === format);
        // Only set li on nodes that don't have type
        slate_1.Transforms.setNodes(editor, { type: 'li' }, {
            voids: true,
            match: (node, path) => {
                const match = slate_1.Element.isElement(node)
                    && typeof node.type === 'undefined'
                    && path.length === parentNodePath.length + 1;
                return match;
            },
        });
        // Wrap nodes that do have a type with an li
        // so as to not lose their existing formatting
        const nodesToWrap = Array.from(slate_1.Editor.nodes(editor, {
            match: (node, path) => {
                const match = slate_1.Element.isElement(node)
                    && typeof node.type !== 'undefined'
                    && node.type !== 'li'
                    && path.length === parentNodePath.length + 1;
                return match;
            },
        }));
        nodesToWrap.forEach(([, path]) => {
            slate_1.Transforms.wrapNodes(editor, { type: 'li', children: [] }, { at: path });
        });
    }
    slate_react_1.ReactEditor.focus(editor);
};
exports.default = toggleList;
//# sourceMappingURL=toggleList.js.map