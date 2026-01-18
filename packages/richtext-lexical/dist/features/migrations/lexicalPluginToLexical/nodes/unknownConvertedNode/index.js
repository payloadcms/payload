import { jsx as _jsx } from "react/jsx-runtime";
import { addClassNamesToElement } from '@lexical/utils';
import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import * as React from 'react';
const Component = /*#__PURE__*/React.lazy(() => import('./Component.js').then(module => ({
  default: module.UnknownConvertedNodeComponent
})));
/** @noInheritDoc */
export class UnknownConvertedNode extends DecoratorNode {
  __data;
  constructor({
    data,
    key
  }) {
    super(key);
    this.__data = data;
  }
  static clone(node) {
    return new this({
      data: node.__data,
      key: node.__key
    });
  }
  static getType() {
    return 'unknownConverted';
  }
  static importJSON(serializedNode) {
    const node = $createUnknownConvertedNode({
      data: serializedNode.data
    });
    return node;
  }
  canInsertTextAfter() {
    return true;
  }
  canInsertTextBefore() {
    return true;
  }
  createDOM(config) {
    const element = document.createElement('span');
    addClassNamesToElement(element, 'unknownConverted');
    return element;
  }
  decorate() {
    return /*#__PURE__*/_jsx(Component, {
      data: this.__data
    });
  }
  exportJSON() {
    return {
      type: this.getType(),
      data: this.__data,
      version: 1
    };
  }
  // Mutation
  isInline() {
    return true;
  }
  updateDOM(prevNode, dom) {
    return false;
  }
}
export function $createUnknownConvertedNode({
  data
}) {
  return $applyNodeReplacement(new UnknownConvertedNode({
    data
  }));
}
export function $isUnknownConvertedNode(node) {
  return node instanceof UnknownConvertedNode;
}
//# sourceMappingURL=index.js.map