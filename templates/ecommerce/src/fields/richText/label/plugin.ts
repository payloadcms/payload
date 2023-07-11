import type { RichTextCustomElement } from 'payload/types'

// @ts-expect-error
const withLabel: RichTextCustomElement['plugins'][0] = incomingEditor => {
  const editor = incomingEditor

  const { shouldBreakOutOnEnter } = editor

  editor.shouldBreakOutOnEnter = element =>
    element.type === 'label' ? true : shouldBreakOutOnEnter(element)

  return editor
}

export default withLabel
