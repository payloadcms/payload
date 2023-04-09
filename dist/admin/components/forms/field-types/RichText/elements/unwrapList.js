"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapList = void 0;
const slate_1 = require("slate");
const areAllChildrenElements_1 = require("./areAllChildrenElements");
const listTypes_1 = __importDefault(require("./listTypes"));
const unwrapList = (editor, atPath) => {
    // Remove type for any nodes that have text children -
    // this means that the node should remain
    slate_1.Transforms.setNodes(editor, { type: undefined }, {
        at: atPath,
        match: (node, path) => {
            const childrenAreAllElements = (0, areAllChildrenElements_1.areAllChildrenElements)(node);
            const matches = !slate_1.Editor.isEditor(node)
                && slate_1.Element.isElement(node)
                && !childrenAreAllElements
                && node.type === 'li'
                && path.length === atPath.length + 1;
            return matches;
        },
    });
    // For nodes have all element children, unwrap it instead
    // because the li is a duplicative wrapper
    slate_1.Transforms.unwrapNodes(editor, {
        at: atPath,
        match: (node, path) => {
            const childrenAreAllElements = (0, areAllChildrenElements_1.areAllChildrenElements)(node);
            const matches = !slate_1.Editor.isEditor(node)
                && slate_1.Element.isElement(node)
                && childrenAreAllElements
                && node.type === 'li'
                && path.length === atPath.length + 1;
            return matches;
        },
    });
    // Finally, unwrap the UL itself
    slate_1.Transforms.unwrapNodes(editor, {
        match: (n) => slate_1.Element.isElement(n) && listTypes_1.default.includes(n.type),
        mode: 'lowest',
    });
};
exports.unwrapList = unwrapList;
//# sourceMappingURL=unwrapList.js.map