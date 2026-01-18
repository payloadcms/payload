import { addClassNamesToElement } from '@lexical/utils';
import ObjectID from 'bson-objectid';
import { $applyNodeReplacement, DecoratorNode } from 'lexical';
export class ServerInlineBlockNode extends DecoratorNode {
  __cacheBuster;
  __fields;
  constructor({
    cacheBuster,
    fields,
    key
  }) {
    super(key);
    this.__fields = fields;
    this.__cacheBuster = cacheBuster || 0;
  }
  static clone(node) {
    return new this({
      cacheBuster: node.__cacheBuster,
      fields: node.__fields,
      key: node.__key
    });
  }
  static getType() {
    return 'inlineBlock';
  }
  static importDOM() {
    return {};
  }
  static importJSON(serializedNode) {
    const node = $createServerInlineBlockNode(serializedNode.fields);
    return node;
  }
  static isInline() {
    return false;
  }
  canIndent() {
    return true;
  }
  createDOM(config) {
    const element = document.createElement('span');
    addClassNamesToElement(element, config?.theme?.inlineBlock);
    return element;
  }
  decorate(editor, config) {
    return null;
  }
  exportDOM() {
    const element = document.createElement('span');
    element.classList.add('inline-block-container');
    const text = document.createTextNode(this.getTextContent());
    element.append(text);
    return {
      element
    };
  }
  exportJSON() {
    return {
      type: 'inlineBlock',
      fields: this.getFields(),
      version: 1
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
  isInline() {
    return true;
  }
  setFields(fields, preventFormStateUpdate) {
    const writable = this.getWritable();
    writable.__fields = fields;
    if (!preventFormStateUpdate) {
      writable.__cacheBuster++;
    }
  }
  updateDOM() {
    return false;
  }
}
export function $createServerInlineBlockNode(fields) {
  return $applyNodeReplacement(new ServerInlineBlockNode({
    fields: {
      ...fields,
      id: fields?.id || new ObjectID.default().toHexString()
    }
  }));
}
export function $isServerInlineBlockNode(node) {
  return node instanceof ServerInlineBlockNode;
}
//# sourceMappingURL=InlineBlocksNode.js.map