import { $applyNodeReplacement, $isElementNode } from 'lexical';
import { LinkNode } from './LinkNode.js';
// Custom node type to override `canInsertTextAfter` that will
// allow typing within the link
export class AutoLinkNode extends LinkNode {
  static clone(node) {
    return new this({
      id: '',
      fields: node.__fields,
      key: node.__key
    });
  }
  static getType() {
    return 'autolink';
  }
  static importDOM() {
    // TODO: Should link node should handle the import over autolink?
    return null;
  }
  static importJSON(serializedNode) {
    const node = $createAutoLinkNode({}).updateFromJSON(serializedNode);
    /**
    * @todo remove in 4.0
    */
    if (serializedNode.version === 1 && typeof serializedNode.fields?.doc?.value === 'object' && serializedNode.fields?.doc?.value?.id) {
      serializedNode.fields.doc.value = serializedNode.fields.doc.value.id;
      serializedNode.version = 2;
    }
    return node;
  }
  // @ts-expect-error
  exportJSON() {
    const serialized = super.exportJSON();
    return {
      type: 'autolink',
      children: serialized.children,
      direction: serialized.direction,
      fields: serialized.fields,
      format: serialized.format,
      indent: serialized.indent,
      version: 2
    };
  }
  insertNewAfter(selection, restoreSelection = true) {
    const element = this.getParentOrThrow().insertNewAfter(selection, restoreSelection);
    if ($isElementNode(element)) {
      const linkNode = $createAutoLinkNode({
        fields: this.__fields
      });
      element.append(linkNode);
      return linkNode;
    }
    return null;
  }
  updateFromJSON(serializedNode) {
    return super.updateFromJSON(serializedNode).setFields(serializedNode.fields);
  }
}
export function $createAutoLinkNode({
  fields
}) {
  return $applyNodeReplacement(new AutoLinkNode({
    id: '',
    fields
  }));
}
export function $isAutoLinkNode(node) {
  return node instanceof AutoLinkNode;
}
//# sourceMappingURL=AutoLinkNode.js.map