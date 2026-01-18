'use client';

import { $applyNodeReplacement } from 'lexical';
import * as React from 'react';
import { HorizontalRuleServerNode } from '../../server/nodes/HorizontalRuleNode.js';
export class HorizontalRuleNode extends HorizontalRuleServerNode {
  static clone(node) {
    return super.clone(node);
  }
  static getType() {
    return super.getType();
  }
  /**
  * The data for this node is stored serialized as JSON. This is the "load function" of that node: it takes the saved data and converts it into a node.
  */
  static importJSON(serializedNode) {
    return $createHorizontalRuleNode();
  }
  /**
  * Allows you to render a React component within whatever createDOM returns.
  */
  decorate() {
    return null;
  }
  exportJSON() {
    return super.exportJSON();
  }
}
function $convertHorizontalRuleElement() {
  return {
    node: $createHorizontalRuleNode()
  };
}
export function $createHorizontalRuleNode() {
  return $applyNodeReplacement(new HorizontalRuleNode());
}
export function $isHorizontalRuleNode(node) {
  return node instanceof HorizontalRuleNode;
}
//# sourceMappingURL=HorizontalRuleNode.js.map