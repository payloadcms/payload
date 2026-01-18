'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { $applyNodeReplacement } from 'lexical';
import * as React from 'react';
import { RelationshipServerNode } from '../../server/nodes/RelationshipNode.js';
const RelationshipComponent = /*#__PURE__*/React.lazy(() => import('../components/RelationshipComponent.js').then(module => ({
  default: module.RelationshipComponent
})));
function $relationshipElementToNode(domNode) {
  const id = domNode.getAttribute('data-lexical-relationship-id');
  const relationTo = domNode.getAttribute('data-lexical-relationship-relationTo');
  if (id != null && relationTo != null) {
    const node = $createRelationshipNode({
      relationTo,
      value: id
    });
    return {
      node
    };
  }
  return null;
}
export class RelationshipNode extends RelationshipServerNode {
  static clone(node) {
    return super.clone(node);
  }
  static getType() {
    return super.getType();
  }
  static importDOM() {
    return {
      div: domNode => {
        if (!domNode.hasAttribute('data-lexical-relationship-relationTo') || !domNode.hasAttribute('data-lexical-relationship-id')) {
          return null;
        }
        return {
          conversion: $relationshipElementToNode,
          priority: 2
        };
      }
    };
  }
  static importJSON(serializedNode) {
    if (serializedNode.version === 1 && serializedNode?.value?.id) {
      serializedNode.value = serializedNode.value.id;
    }
    const importedData = {
      relationTo: serializedNode.relationTo,
      value: serializedNode.value
    };
    const node = $createRelationshipNode(importedData);
    node.setFormat(serializedNode.format);
    return node;
  }
  decorate(editor, config) {
    return /*#__PURE__*/_jsx(RelationshipComponent, {
      className: config.theme.relationship ?? 'LexicalEditorTheme__relationship',
      data: this.__data,
      format: this.__format,
      nodeKey: this.getKey()
    });
  }
  exportJSON() {
    return super.exportJSON();
  }
}
export function $createRelationshipNode(data) {
  return $applyNodeReplacement(new RelationshipNode({
    data
  }));
}
export function $isRelationshipNode(node) {
  return node instanceof RelationshipNode;
}
//# sourceMappingURL=RelationshipNode.js.map