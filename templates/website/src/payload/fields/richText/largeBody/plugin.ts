import type { RichTextCustomElement } from 'payload/types'

const withLargeBody: RichTextCustomElement['plugins'][0] = incomingEditor => {
  const editor = incomingEditor

  // @ts-expect-error
  const { shouldBreakOutOnEnter } = editor

  // @ts-expect-error
  editor.shouldBreakOutOnEnter = element =>
    element.type === 'large-body' ? true : shouldBreakOutOnEnter(element)

  return editor
}

export default withLargeBody
