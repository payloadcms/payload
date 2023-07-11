import type { RichTextCustomElement } from 'payload/types'

// @ts-expect-error
const withLargeBody: RichTextCustomElement['plugins'][0] = incomingEditor => {
  const editor = incomingEditor

  const { shouldBreakOutOnEnter } = editor

  editor.shouldBreakOutOnEnter = element =>
    element.type === 'large-body' ? true : shouldBreakOutOnEnter(element)

  return editor
}

export default withLargeBody
