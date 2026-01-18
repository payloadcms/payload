'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import ObjectID from 'bson-objectid';
import { $applyNodeReplacement } from 'lexical';
import React from 'react';
import { ServerBlockNode } from '../../server/nodes/BlocksNode.js';
import { BlockComponent } from '../component/index.js';
export class BlockNode extends ServerBlockNode {
  static clone(node) {
    return super.clone(node);
  }
  static getType() {
    return super.getType();
  }
  static importJSON(serializedNode) {
    if (serializedNode.version === 1) {
      // Convert (version 1 had the fields wrapped in another, unnecessary data property)
      serializedNode = {
        ...serializedNode,
        fields: {
          ...serializedNode.fields.data
        },
        version: 2
      };
    }
    const node = $createBlockNode(serializedNode.fields);
    node.setFormat(serializedNode.format);
    return node;
  }
  decorate(_editor, config) {
    return /*#__PURE__*/_jsx(BlockComponent, {
      cacheBuster: this.getCacheBuster(),
      className: config.theme.block ?? 'LexicalEditorTheme__block',
      formData: this.getFields(),
      nodeKey: this.getKey()
    });
  }
  exportJSON() {
    return super.exportJSON();
  }
}
export function $createBlockNode(fields) {
  return $applyNodeReplacement(new BlockNode({
    fields: {
      ...fields,
      id: fields?.id || new ObjectID.default().toHexString()
    }
  }));
}
export function $isBlockNode(node) {
  return node instanceof BlockNode;
}
//# sourceMappingURL=BlocksNode.js.map