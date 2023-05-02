"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areAllChildrenElements = void 0;
const slate_1 = require("slate");
const areAllChildrenElements = (node) => {
    return Array.isArray(node.children) && node.children.every((child) => slate_1.Element.isElement(child));
};
exports.areAllChildrenElements = areAllChildrenElements;
//# sourceMappingURL=areAllChildrenElements.js.map