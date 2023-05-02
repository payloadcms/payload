"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const slate_react_1 = require("slate-react");
const slate_1 = require("slate");
const IndentLeft_1 = __importDefault(require("../../../../../icons/IndentLeft"));
const IndentRight_1 = __importDefault(require("../../../../../icons/IndentRight"));
const Button_1 = require("../Button");
const isActive_1 = __importDefault(require("../isActive"));
const listTypes_1 = __importDefault(require("../listTypes"));
const getCommonBlock_1 = require("../getCommonBlock");
const unwrapList_1 = require("../unwrapList");
const indentType = 'indent';
const IndentWithPadding = ({ attributes, children }) => (react_1.default.createElement("div", { style: { paddingLeft: 25 }, ...attributes }, children));
const indent = {
    Button: () => {
        const editor = (0, slate_react_1.useSlate)();
        const handleIndent = (0, react_1.useCallback)((e, dir) => {
            e.preventDefault();
            if (dir === 'left') {
                if ((0, isActive_1.default)(editor, 'li')) {
                    const [, listPath] = (0, getCommonBlock_1.getCommonBlock)(editor, (n) => slate_1.Element.isElement(n) && listTypes_1.default.includes(n.type));
                    const matchedParentList = slate_1.Editor.above(editor, {
                        at: listPath,
                        match: (n) => !slate_1.Editor.isEditor(n) && slate_1.Editor.isBlock(editor, n),
                    });
                    if (matchedParentList) {
                        const [parentListItem, parentListItemPath] = matchedParentList;
                        if (parentListItem.children.length > 1) {
                            // Remove nested list
                            slate_1.Transforms.unwrapNodes(editor, {
                                at: parentListItemPath,
                                match: (node, path) => {
                                    const matches = !slate_1.Editor.isEditor(node)
                                        && slate_1.Element.isElement(node)
                                        && listTypes_1.default.includes(node.type)
                                        && path.length === parentListItemPath.length + 1;
                                    return matches;
                                },
                            });
                            // Set li type on any children that don't have a type
                            slate_1.Transforms.setNodes(editor, { type: 'li' }, {
                                at: parentListItemPath,
                                match: (node, path) => {
                                    const matches = !slate_1.Editor.isEditor(node)
                                        && slate_1.Element.isElement(node)
                                        && node.type !== 'li'
                                        && path.length === parentListItemPath.length + 1;
                                    return matches;
                                },
                            });
                            // Parent list item path has changed at this point
                            // so we need to re-fetch the parent node
                            const [newParentNode] = slate_1.Editor.node(editor, parentListItemPath);
                            // If the parent node is an li,
                            // lift all li nodes within
                            if (slate_1.Element.isElement(newParentNode) && newParentNode.type === 'li') {
                                // Lift the nested lis
                                slate_1.Transforms.liftNodes(editor, {
                                    at: parentListItemPath,
                                    match: (node, path) => {
                                        const matches = !slate_1.Editor.isEditor(node)
                                            && slate_1.Element.isElement(node)
                                            && path.length === parentListItemPath.length + 1
                                            && node.type === 'li';
                                        return matches;
                                    },
                                });
                            }
                        }
                        else {
                            slate_1.Transforms.unwrapNodes(editor, {
                                at: parentListItemPath,
                                match: (node, path) => {
                                    return slate_1.Element.isElement(node)
                                        && node.type === 'li'
                                        && path.length === parentListItemPath.length;
                                },
                            });
                            slate_1.Transforms.unwrapNodes(editor, {
                                match: (n) => slate_1.Element.isElement(n) && listTypes_1.default.includes(n.type),
                            });
                        }
                    }
                    else {
                        (0, unwrapList_1.unwrapList)(editor, listPath);
                    }
                }
                else {
                    slate_1.Transforms.unwrapNodes(editor, {
                        match: (n) => slate_1.Element.isElement(n) && n.type === indentType,
                        split: true,
                        mode: 'lowest',
                    });
                }
            }
            if (dir === 'right') {
                const isCurrentlyOL = (0, isActive_1.default)(editor, 'ol');
                const isCurrentlyUL = (0, isActive_1.default)(editor, 'ul');
                if (isCurrentlyOL || isCurrentlyUL) {
                    // Get the path of the first selected li -
                    // Multiple lis could be selected
                    // and the selection may start in the middle of the first li
                    const [[, firstSelectedLIPath]] = Array.from(slate_1.Editor.nodes(editor, {
                        mode: 'lowest',
                        match: (node) => slate_1.Element.isElement(node) && node.type === 'li',
                    }));
                    // Is the first selected li the first in its list?
                    const hasPrecedingLI = firstSelectedLIPath[firstSelectedLIPath.length - 1] > 0;
                    // If the first selected li is NOT the first in its list,
                    // we need to inject it into the prior li
                    if (hasPrecedingLI) {
                        const [, precedingLIPath] = slate_1.Editor.previous(editor, {
                            at: firstSelectedLIPath,
                        });
                        const [precedingLIChildren] = slate_1.Editor.node(editor, [...precedingLIPath, 0]);
                        const precedingLIChildrenIsText = slate_1.Text.isText(precedingLIChildren);
                        if (precedingLIChildrenIsText) {
                            // Wrap the prior li text content so that it can be nested next to a list
                            slate_1.Transforms.wrapNodes(editor, { children: [] }, { at: [...precedingLIPath, 0] });
                        }
                        // Move the selected lis after the prior li contents
                        slate_1.Transforms.moveNodes(editor, {
                            to: [...precedingLIPath, 1],
                            match: (node) => slate_1.Element.isElement(node) && node.type === 'li',
                            mode: 'lowest',
                        });
                        // Wrap the selected lis in a new list
                        slate_1.Transforms.wrapNodes(editor, {
                            type: isCurrentlyOL ? 'ol' : 'ul', children: [],
                        }, {
                            match: (node) => slate_1.Element.isElement(node) && node.type === 'li',
                            mode: 'lowest',
                        });
                    }
                    else {
                        // Otherwise, just wrap the node in a list / li
                        slate_1.Transforms.wrapNodes(editor, {
                            type: isCurrentlyOL ? 'ol' : 'ul', children: [{ type: 'li', children: [] }],
                        }, {
                            match: (node) => slate_1.Element.isElement(node) && node.type === 'li',
                            mode: 'lowest',
                        });
                    }
                }
                else {
                    slate_1.Transforms.wrapNodes(editor, { type: indentType, children: [] });
                }
            }
            slate_react_1.ReactEditor.focus(editor);
        }, [editor]);
        const canDeIndent = (0, isActive_1.default)(editor, 'li') || (0, isActive_1.default)(editor, indentType);
        return (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("button", { type: "button", className: [
                    Button_1.baseClass,
                    !canDeIndent && `${Button_1.baseClass}--disabled`,
                ].filter(Boolean).join(' '), onClick: canDeIndent ? (e) => handleIndent(e, 'left') : undefined },
                react_1.default.createElement(IndentLeft_1.default, null)),
            react_1.default.createElement("button", { type: "button", className: Button_1.baseClass, onClick: (e) => handleIndent(e, 'right') },
                react_1.default.createElement(IndentRight_1.default, null))));
    },
    Element: IndentWithPadding,
};
exports.default = indent;
//# sourceMappingURL=index.js.map