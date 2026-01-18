import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import { addClassNamesToElement } from '@lexical/utils';
import ObjectID from 'bson-objectid';
import { $applyNodeReplacement } from 'lexical';
import { $convertUploadElement } from './conversions.js';
export class UploadServerNode extends DecoratorBlockNode {
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
    return 'upload';
  }
  static importDOM() {
    return {
      img: node => ({
        conversion: domNode => $convertUploadElement(domNode, $createUploadServerNode),
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
    const node = $createUploadServerNode({
      data: importedData
    });
    node.setFormat(serializedNode.format);
    return node;
  }
  static isInline() {
    return false;
  }
  createDOM(config) {
    const element = document.createElement('div');
    addClassNamesToElement(element, config?.theme?.upload);
    return element;
  }
  decorate() {
    return null;
  }
  exportDOM() {
    const element = document.createElement('img');
    const data = this.__data;
    if (data.pending) {
      element.setAttribute('data-lexical-pending-upload-form-id', String(data?.pending?.formID));
      element.setAttribute('src', data?.pending?.src || '');
    } else {
      element.setAttribute('data-lexical-upload-id', String(data?.value));
      element.setAttribute('data-lexical-upload-relation-to', data?.relationTo);
    }
    return {
      element
    };
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      ...this.getData(),
      type: 'upload',
      version: 3
    };
  }
  getData() {
    return this.getLatest().__data;
  }
  setData(data) {
    const writable = this.getWritable();
    writable.__data = data;
  }
  updateDOM() {
    return false;
  }
}
export function $createUploadServerNode({
  data
}) {
  if (!data?.id) {
    data.id = new ObjectID.default().toHexString();
  }
  return $applyNodeReplacement(new UploadServerNode({
    data: data
  }));
}
export function $isUploadServerNode(node) {
  return node instanceof UploadServerNode;
}
//# sourceMappingURL=UploadNode.js.map