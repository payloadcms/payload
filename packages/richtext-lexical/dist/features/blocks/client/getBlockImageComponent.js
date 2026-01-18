import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { BlockIcon } from '../../../lexical/ui/icons/Block/index.js';
export function getBlockImageComponent(imageURL, imageAltText) {
  if (!imageURL) {
    return BlockIcon;
  }
  return () => /*#__PURE__*/_jsx("img", {
    alt: imageAltText ?? 'Block Image',
    className: "lexical-block-custom-image",
    src: imageURL,
    style: {
      maxHeight: 20,
      maxWidth: 20
    }
  });
}
//# sourceMappingURL=getBlockImageComponent.js.map