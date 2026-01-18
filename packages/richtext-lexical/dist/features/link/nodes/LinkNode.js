import { addClassNamesToElement, isHTMLAnchorElement } from '@lexical/utils';
import ObjectID from 'bson-objectid';
import { $applyNodeReplacement, $createTextNode, $getSelection, $isElementNode, $isRangeSelection, createCommand, ElementNode } from 'lexical';
const SUPPORTED_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'sms:', 'tel:']);
/** @noInheritDoc */
export class LinkNode extends ElementNode {
  __fields;
  __id;
  constructor({
    id,
    fields = {
      linkType: 'custom',
      newTab: false
    },
    key
  }) {
    super(key);
    this.__fields = fields;
    this.__id = id;
  }
  static clone(node) {
    return new this({
      id: node.__id,
      fields: node.__fields,
      key: node.__key
    });
  }
  static getType() {
    return 'link';
  }
  static importDOM() {
    return {
      a: node => ({
        conversion: $convertAnchorElement,
        priority: 1
      })
    };
  }
  static importJSON(serializedNode) {
    const node = $createLinkNode({}).updateFromJSON(serializedNode);
    /**
    * @todo remove this in 4.0
    */
    if (serializedNode.version === 1 && typeof serializedNode.fields?.doc?.value === 'object' && serializedNode.fields?.doc?.value?.id) {
      serializedNode.fields.doc.value = serializedNode.fields.doc.value.id;
      serializedNode.version = 2;
    }
    if (serializedNode.version === 2 && !serializedNode.id) {
      serializedNode.id = new ObjectID.default().toHexString();
      serializedNode.version = 3;
    }
    return node;
  }
  canBeEmpty() {
    return false;
  }
  canInsertTextAfter() {
    return false;
  }
  canInsertTextBefore() {
    return false;
  }
  createDOM(config) {
    const element = document.createElement('a');
    if (this.__fields?.linkType === 'custom') {
      element.href = this.sanitizeUrl(this.__fields.url ?? '');
    }
    if (this.__fields?.newTab ?? false) {
      element.target = '_blank';
    }
    if (this.__fields?.newTab === true && this.__fields?.linkType === 'custom') {
      element.rel = manageRel(element.rel, 'add', 'noopener');
    }
    addClassNamesToElement(element, config.theme.link);
    return element;
  }
  exportJSON() {
    const fields = this.getFields();
    if (fields?.linkType === 'internal') {
      delete fields.url;
    } else if (fields?.linkType === 'custom') {
      delete fields.doc;
    }
    const returnObject = {
      ...super.exportJSON(),
      type: 'link',
      fields,
      version: 3
    };
    const id = this.getID();
    if (id) {
      returnObject.id = id;
    }
    return returnObject;
  }
  extractWithChild(child, selection, destination) {
    if (!$isRangeSelection(selection)) {
      return false;
    }
    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();
    return this.isParentOf(anchorNode) && this.isParentOf(focusNode) && selection.getTextContent().length > 0;
  }
  getFields() {
    return this.getLatest().__fields;
  }
  getID() {
    return this.getLatest().__id;
  }
  insertNewAfter(selection, restoreSelection = true) {
    const element = this.getParentOrThrow().insertNewAfter(selection, restoreSelection);
    if ($isElementNode(element)) {
      const linkNode = $createLinkNode({
        fields: this.__fields
      });
      element.append(linkNode);
      return linkNode;
    }
    return null;
  }
  isInline() {
    return true;
  }
  sanitizeUrl(url) {
    try {
      const parsedUrl = new URL(url);
      if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
        return 'about:blank';
      }
    } catch (e) {
      return 'https://';
    }
    return url;
  }
  setFields(fields) {
    const writable = this.getWritable();
    writable.__fields = fields;
    return writable;
  }
  setID(id) {
    const writable = this.getWritable();
    writable.__id = id;
    return writable;
  }
  updateDOM(prevNode, anchor, config) {
    const url = this.__fields?.url;
    const newTab = this.__fields?.newTab;
    if (url != null && url !== prevNode.__fields?.url && this.__fields?.linkType === 'custom') {
      anchor.href = url;
    }
    if (this.__fields?.linkType === 'internal' && prevNode.__fields?.linkType === 'custom') {
      anchor.removeAttribute('href');
    }
    // TODO: not 100% sure why we're settign rel to '' - revisit
    // Start rel config here, then check newTab below
    if (anchor.rel == null) {
      anchor.rel = '';
    }
    if (newTab !== prevNode.__fields?.newTab) {
      if (newTab ?? false) {
        anchor.target = '_blank';
        if (this.__fields?.linkType === 'custom') {
          anchor.rel = manageRel(anchor.rel, 'add', 'noopener');
        }
      } else {
        anchor.removeAttribute('target');
        anchor.rel = manageRel(anchor.rel, 'remove', 'noopener');
      }
    }
    return false;
  }
  updateFromJSON(serializedNode) {
    return super.updateFromJSON(serializedNode).setFields(serializedNode.fields).setID(serializedNode.id);
  }
}
function $convertAnchorElement(domNode) {
  let node = null;
  if (isHTMLAnchorElement(domNode)) {
    const content = domNode.textContent;
    if (content !== null && content !== '') {
      node = $createLinkNode({
        id: new ObjectID.default().toHexString(),
        fields: {
          doc: null,
          linkType: 'custom',
          newTab: domNode.getAttribute('target') === '_blank',
          url: domNode.getAttribute('href') ?? ''
        }
      });
    }
  }
  return {
    node
  };
}
export function $createLinkNode({
  id,
  fields
}) {
  return $applyNodeReplacement(new LinkNode({
    id: id ?? new ObjectID.default().toHexString(),
    fields
  }));
}
export function $isLinkNode(node) {
  return node instanceof LinkNode;
}
export const TOGGLE_LINK_COMMAND = createCommand('TOGGLE_LINK_COMMAND');
export function $toggleLink(payload) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) && (payload === null || !payload.selectedNodes?.length)) {
    return;
  }
  const nodes = $isRangeSelection(selection) ? selection.extract() : payload === null ? [] : payload.selectedNodes;
  if (payload === null) {
    // Remove LinkNodes
    nodes?.forEach(node => {
      const parent = node.getParent();
      if ($isLinkNode(parent)) {
        const children = parent.getChildren();
        children.forEach(child => {
          parent.insertBefore(child);
        });
        parent.remove();
      }
    });
    return;
  }
  // Add or merge LinkNodes
  if (nodes?.length === 1) {
    const firstNode = nodes[0];
    // if the first node is a LinkNode or if its
    // parent is a LinkNode, we update the URL, target and rel.
    const linkNode = $isLinkNode(firstNode) ? firstNode : $getLinkAncestor(firstNode);
    if (linkNode !== null) {
      linkNode.setFields(payload.fields);
      if (payload.text != null && payload.text !== linkNode.getTextContent()) {
        // remove all children and add child with new textcontent:
        linkNode.append($createTextNode(payload.text));
        linkNode.getChildren().forEach(child => {
          if (child !== linkNode.getLastChild()) {
            child.remove();
          }
        });
      }
      return;
    }
  }
  let prevParent = null;
  let linkNode = null;
  nodes?.forEach(node => {
    const parent = node.getParent();
    if (parent === linkNode || parent === null || $isElementNode(node) && !node.isInline()) {
      return;
    }
    if ($isLinkNode(parent)) {
      linkNode = parent;
      parent.setFields(payload.fields);
      if (payload.text != null && payload.text !== parent.getTextContent()) {
        // remove all children and add child with new textcontent:
        parent.append($createTextNode(payload.text));
        parent.getChildren().forEach(child => {
          if (child !== parent.getLastChild()) {
            child.remove();
          }
        });
      }
      return;
    }
    if (!parent.is(prevParent)) {
      prevParent = parent;
      linkNode = $createLinkNode({
        fields: payload.fields
      });
      if ($isLinkNode(parent)) {
        if (node.getPreviousSibling() === null) {
          parent.insertBefore(linkNode);
        } else {
          parent.insertAfter(linkNode);
        }
      } else {
        node.insertBefore(linkNode);
      }
    }
    if ($isLinkNode(node)) {
      if (node.is(linkNode)) {
        return;
      }
      if (linkNode !== null) {
        const children = node.getChildren();
        linkNode.append(...children);
      }
      node.remove();
      return;
    }
    if (linkNode !== null) {
      linkNode.append(node);
    }
  });
}
function $getLinkAncestor(node) {
  return $getAncestor(node, ancestor => $isLinkNode(ancestor));
}
function $getAncestor(node, predicate) {
  let parent = node;
  while (parent !== null) {
    parent = parent.getParent();
    if (parent === null || predicate(parent)) {
      break;
    }
  }
  return parent;
}
function manageRel(input, action, value) {
  let result;
  let mutableInput = `${input}`;
  if (action === 'add') {
    // if we somehow got out of sync - clean up
    if (mutableInput.includes(value)) {
      const re = new RegExp(value, 'g');
      mutableInput = mutableInput.replace(re, '').trim();
    }
    mutableInput = mutableInput.trim();
    result = mutableInput.length === 0 ? `${value}` : `${mutableInput} ${value}`;
  } else {
    const re = new RegExp(value, 'g');
    result = mutableInput.replace(re, '').trim();
  }
  return result;
}
//# sourceMappingURL=LinkNode.js.map