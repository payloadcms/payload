import { Element, Node } from 'slate';

export const areAllChildrenElements = (node: Node): boolean => {
  return Array.isArray(node.children) && node.children.every((child) => Element.isElement(child));
};
