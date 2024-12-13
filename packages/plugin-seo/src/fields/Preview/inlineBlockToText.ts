import type { TypeWithID } from 'payload'

export const inlineBlockToText = (args: { documentData: TypeWithID; inlineBlock: any }) => {
  if (args.inlineBlock.fields.blockType === 'Product Name') {
    // @ts-expect-error
    return args.documentData.productName
  }
  if (args.inlineBlock.fields.blockType === 'Collection Name') {
    // @ts-expect-error
    return args.documentData.collectionName
  }
  if (args.inlineBlock.fields.blockType === 'City') {
    // @ts-expect-error
    return args.documentData.city
  }
  if (args.inlineBlock.fields.blockType === 'Florist Name') {
    // @ts-expect-error
    return args.documentData.floristName
  }
  return 'Inline Block'
}

export function recurseEditorState(
  editorState: any[],
  textContent: string[],
  i: number = 0,
  documentData: TypeWithID,
): string[] {
  for (const node of editorState) {
    i++
    if (node?.type === 'inlineBlock') {
      textContent.push(inlineBlockToText({ documentData, inlineBlock: node }))
    } else if ('text' in node && node.text) {
      textContent.push(node.text as string)
    } else {
      if (!('children' in node)) {
        textContent.push(node.type)
      }
    }
    if ('children' in node && node.children) {
      textContent = recurseEditorState(node.children as any[], textContent, i, documentData)
    }
  }
  return textContent
}
