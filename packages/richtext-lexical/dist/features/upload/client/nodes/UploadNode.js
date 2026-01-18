'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import ObjectID from 'bson-objectid';
import { $applyNodeReplacement } from 'lexical';
import * as React from 'react';
import { $convertUploadElement } from '../../server/nodes/conversions.js';
import { UploadServerNode } from '../../server/nodes/UploadNode.js';
import { PendingUploadComponent } from '../component/pending/index.js';
const RawUploadComponent = /*#__PURE__*/React.lazy(() => import('../../client/component/index.js').then(module => ({
  default: module.UploadComponent
})));
export class UploadNode extends UploadServerNode {
  static clone(node) {
    return super.clone(node);
  }
  static getType() {
    return super.getType();
  }
  static importDOM() {
    return {
      img: node => ({
        conversion: domNode => $convertUploadElement(domNode, $createUploadNode),
        priority: 0
      })
    };
  }
  static importJSON(serializedNode) {
    if (serializedNode.version === 1 && serializedNode?.value?.id) {
      serializedNode.value = serializedNode.value.id;
    }
    if (serializedNode.version === 2 && !serializedNode?.id) {
      serializedNode.id = new ObjectID.default().toHexString();
      serializedNode.version = 3;
    }
    const importedData = {
      id: serializedNode.id,
      fields: serializedNode.fields,
      pending: serializedNode.pending,
      relationTo: serializedNode.relationTo,
      value: serializedNode.value
    };
    const node = $createUploadNode({
      data: importedData
    });
    node.setFormat(serializedNode.format);
    return node;
  }
  decorate(editor, config) {
    if (this.__data.pending) {
      return /*#__PURE__*/_jsx(PendingUploadComponent, {});
    }
    return /*#__PURE__*/_jsx(RawUploadComponent, {
      className: config?.theme?.upload ?? 'LexicalEditorTheme__upload',
      data: this.__data,
      format: this.__format,
      nodeKey: this.getKey()
    });
  }
  exportJSON() {
    return super.exportJSON();
  }
}
export function $createUploadNode({
  data
}) {
  if (!data?.id) {
    data.id = new ObjectID.default().toHexString();
  }
  return $applyNodeReplacement(new UploadNode({
    data: data
  }));
}
export function $isUploadNode(node) {
  return node instanceof UploadNode;
}
//# sourceMappingURL=UploadNode.js.map