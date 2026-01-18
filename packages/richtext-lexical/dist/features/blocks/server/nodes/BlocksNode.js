import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import { addClassNamesToElement } from '@lexical/utils';
import ObjectID from 'bson-objectid';
import { $applyNodeReplacement } from 'lexical';
export class ServerBlockNode extends DecoratorBlockNode {
  __cacheBuster;
  __fields;
  constructor({
    cacheBuster,
    fields,
    format,
    key
  }) {
    super(format, key);
    this.__fields = fields;
    this.__cacheBuster = cacheBuster || 0;
  }
  static clone(node) {
    return new this({
      cacheBuster: node.__cacheBuster,
      fields: node.__fields,
      format: node.__format,
      key: node.__key
    });
  }
  static getType() {
    return 'block';
  }
  static importDOM() {
    return {};
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
    const node = $createServerBlockNode(serializedNode.fields);
    node.setFormat(serializedNode.format);
    return node;
  }
  static isInline() {
    return false;
  }
  createDOM(config) {
    const element = document.createElement('div');
    addClassNamesToElement(element, config?.theme?.block);
    return element;
  }
  decorate(editor, config) {
    return null;
  }
  exportDOM() {
    const element = document.createElement('div');
    const text = document.createTextNode(this.getTextContent());
    element.append(text);
    return {
      element
    };
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'block',
      fields: this.getFields(),
      version: 2
    };
  }
  getCacheBuster() {
    return this.getLatest().__cacheBuster;
  }
  getFields() {
    return this.getLatest().__fields;
  }
  getTextContent() {
    return `Block Field`;
  }
  setFields(fields, preventFormStateUpdate) {
    const writable = this.getWritable();
    writable.__fields = fields;
    if (!preventFormStateUpdate) {
      writable.__cacheBuster++;
    }
  }
}
export function $createServerBlockNode(fields) {
  return $applyNodeReplacement(new ServerBlockNode({
    fields: {
      ...fields,
      id: fields?.id || new ObjectID.default().toHexString()
    }
  }));
}
export function $isServerBlockNode(node) {
  return node instanceof ServerBlockNode;
}
//# sourceMappingURL=BlocksNode.js.map