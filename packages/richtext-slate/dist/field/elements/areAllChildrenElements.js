import { Element } from 'slate';
export const areAllChildrenElements = (node)=>{
    return Array.isArray(node.children) && node.children.every((child)=>Element.isElement(child));
};

//# sourceMappingURL=areAllChildrenElements.js.map