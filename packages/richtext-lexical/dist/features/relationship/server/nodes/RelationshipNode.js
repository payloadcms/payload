import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import { addClassNamesToElement } from '@lexical/utils';
import { $applyNodeReplacement } from 'lexical';
function $relationshipElementToServerNode(domNode) {
  const id = domNode.getAttribute('data-lexical-relationship-id');
  const relationTo = domNode.getAttribute('data-lexical-relationship-relationTo');
  if (id != null && relationTo != null) {
    const node = $createServerRelationshipNode({
      relationTo,
      value: id
    });
    return {
      node
    };
  }
  return null;
}
export class RelationshipServerNode extends DecoratorBlockNode {
  __data;
  constructor({
    data,
    format,
    key
  }) {
    super(format, key);
    this.__data = data;
  }
  static clone(node) {
    return new this({
      data: node.__data,
      format: node.__format,
      key: node.__key
    });
  }
  static getType() {
    return 'relationship';
  }
  static importDOM() {
    return {
      div: domNode => {
        if (!domNode.hasAttribute('data-lexical-relationship-relationTo') || !domNode.hasAttribute('data-lexical-relationship-id')) {
          return null;
        }
        return {
          conversion: $relationshipElementToServerNode,
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
    const node = $createServerRelationshipNode(importedData);
    node.setFormat(serializedNode.format);
    return node;
  }
  static isInline() {
    return false;
  }
  createDOM(config) {
    const element = document.createElement('div');
    addClassNamesToElement(element, config?.theme?.relationship);
    return element;
  }
  decorate(_editor, _config) {
    return null;
  }
  exportDOM() {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-relationship-id', String(typeof this.__data?.value === 'object' ? this.__data?.value?.id : this.__data?.value));
    element.setAttribute('data-lexical-relationship-relationTo', this.__data?.relationTo);
    const text = document.createTextNode(this.getTextContent());
    element.append(text);
    return {
      element
    };
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      ...this.getData(),
      type: 'relationship',
      version: 2
    };
  }
  getData() {
    return this.getLatest().__data;
  }
  getTextContent() {
    return `${this.__data?.relationTo} relation to ${typeof this.__data?.value === 'object' ? this.__data?.value?.id : this.__data?.value}`;
  }
  setData(data) {
    const writable = this.getWritable();
    writable.__data = data;
  }
}
export function $createServerRelationshipNode(data) {
  return $applyNodeReplacement(new RelationshipServerNode({
    data
  }));
}
export function $isServerRelationshipNode(node) {
  return node instanceof RelationshipServerNode;
}
//# sourceMappingURL=RelationshipNode.js.map