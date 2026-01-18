// This file contains functions used to convert dom elements to upload or pending upload lexical nodes. It requires the actual node
// creation functions to be passed in to stay compatible with both client and server code.
import ObjectID from 'bson-objectid';
export function isGoogleDocCheckboxImg(img) {
  return img.parentElement != null && img.parentElement.tagName === 'LI' && img.previousSibling === null && img.getAttribute('aria-roledescription') === 'checkbox';
}
export function $convertUploadElement(domNode, $createNode) {
  if (domNode.hasAttribute('data-lexical-pending-upload-form-id')) {
    const formID = domNode.getAttribute('data-lexical-pending-upload-form-id');
    if (formID != null) {
      const node = $createNode({
        data: {
          pending: {
            formID,
            src: domNode.getAttribute('src') || ''
          }
        }
      });
      return {
        node
      };
    }
  }
  if (domNode.hasAttribute('data-lexical-upload-relation-to') && domNode.hasAttribute('data-lexical-upload-id')) {
    const id = domNode.getAttribute('data-lexical-upload-id');
    const relationTo = domNode.getAttribute('data-lexical-upload-relation-to');
    if (id != null && relationTo != null) {
      const node = $createNode({
        data: {
          fields: {},
          relationTo,
          value: id
        }
      });
      return {
        node
      };
    }
  }
  // Create pending UploadNode. Auto-Upload functionality will then be handled by the node transform
  const node = $createNode({
    data: {
      pending: {
        formID: new ObjectID.default().toHexString(),
        src: domNode.getAttribute('src') || ''
      }
    }
  });
  return {
    node
  };
}
//# sourceMappingURL=conversions.js.map