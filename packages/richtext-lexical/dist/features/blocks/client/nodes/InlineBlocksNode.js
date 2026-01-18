'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import ObjectID from 'bson-objectid';
import { $applyNodeReplacement } from 'lexical';
import React from 'react';
import { ServerInlineBlockNode } from '../../server/nodes/InlineBlocksNode.js';
const InlineBlockComponent = /*#__PURE__*/React.lazy(() => import('../componentInline/index.js').then(module => ({
  default: module.InlineBlockComponent
})));
export class InlineBlockNode extends ServerInlineBlockNode {
  static clone(node) {
    return super.clone(node);
  }
  static getType() {
    return super.getType();
  }
  static importJSON(serializedNode) {
    const node = $createInlineBlockNode(serializedNode.fields);
    return node;
  }
  decorate(_editor, config) {
    return /*#__PURE__*/_jsx(InlineBlockComponent, {
      cacheBuster: this.getCacheBuster(),
      className: config.theme.inlineBlock ?? 'LexicalEditorTheme__inlineBlock',
      formData: this.getFields(),
      nodeKey: this.getKey()
    });
  }
  exportJSON() {
    return super.exportJSON();
  }
}
export function $createInlineBlockNode(fields) {
  return $applyNodeReplacement(new InlineBlockNode({
    fields: {
      ...fields,
      id: fields?.id || new ObjectID.default().toHexString()
    }
  }));
}
export function $isInlineBlockNode(node) {
  return node instanceof InlineBlockNode;
}
//# sourceMappingURL=InlineBlocksNode.js.map