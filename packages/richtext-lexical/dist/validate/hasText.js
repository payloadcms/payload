export function hasText(value) {
  const hasChildren = !!value?.root?.children?.length;
  let hasOnlyEmptyParagraph = false;
  if (value?.root?.children?.length === 1) {
    if (value?.root?.children[0]?.type === 'paragraph') {
      const paragraphNode = value?.root?.children[0];
      if (!paragraphNode?.children || paragraphNode?.children?.length === 0) {
        hasOnlyEmptyParagraph = true;
      } else if (paragraphNode?.children?.length === 1) {
        const paragraphNodeChild = paragraphNode?.children[0];
        if (paragraphNodeChild?.type === 'text') {
          if (!paragraphNodeChild?.['text']?.length) {
            hasOnlyEmptyParagraph = true;
          }
        }
      }
    }
  }
  if (!hasChildren || hasOnlyEmptyParagraph) {
    return false;
  } else {
    return true;
  }
}
//# sourceMappingURL=hasText.js.map