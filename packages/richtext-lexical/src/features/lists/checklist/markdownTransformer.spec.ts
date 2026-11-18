import { createHeadlessEditor } from '@lexical/headless'
import {
  $insertList,
  $isListItemNode,
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  ListItemNode,
  ListNode,
  registerList,
} from '@lexical/list'
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  BOLD_STAR,
  ORDERED_LIST,
  STRIKETHROUGH,
  UNORDERED_LIST,
  registerMarkdownShortcuts,
} from '@lexical/markdown'
import { registerRichText } from '@lexical/rich-text'
import type { LexicalEditor, TextFormatType, TextNode } from 'lexical'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
} from 'lexical'
import { describe, expect, it } from 'vitest'

import { PAYLOAD_CHECK_LIST } from './markdownTransformer.js'

function createTestEditor(): LexicalEditor {
  const editor = createHeadlessEditor({
    nodes: [ListNode, ListItemNode],
    onError(error) {
      throw error
    },
  })

  registerRichText(editor)
  registerList(editor)
  editor.registerCommand(
    INSERT_CHECK_LIST_COMMAND,
    () => {
      $insertList('check')

      return true
    },
    COMMAND_PRIORITY_LOW,
  )
  registerMarkdownShortcuts(editor, [
    PAYLOAD_CHECK_LIST,
    UNORDERED_LIST,
    ORDERED_LIST,
    STRIKETHROUGH,
    BOLD_STAR,
  ])

  editor.update(
    () => {
      const paragraph = $createParagraphNode()

      $getRoot().clear().append(paragraph)
      paragraph.select()
    },
    { discrete: true },
  )

  return editor
}

function type({ editor, text }: { editor: LexicalEditor; text: string }) {
  for (const character of text) {
    editor.update(
      () => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          throw new Error('Expected a range selection')
        }

        selection.insertText(character)
      },
      { discrete: true },
    )
  }
}

function pressEnter({ editor }: { editor: LexicalEditor }) {
  editor.update(
    () => {
      editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)
    },
    { discrete: true },
  )
}

function selectCurrentText({ editor }: { editor: LexicalEditor }) {
  editor.update(
    () => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection)) {
        throw new Error('Expected a range selection')
      }

      const node = selection.anchor.getNode()

      if (!$isTextNode(node)) {
        throw new Error('Expected a text node')
      }

      node.select(0, node.getTextContentSize())
    },
    { discrete: true },
  )
}

function toggleFormat({ editor, format }: { editor: LexicalEditor; format: TextFormatType }) {
  editor.update(
    () => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
    },
    { discrete: true },
  )
}

function collapseToEnd({ editor }: { editor: LexicalEditor }) {
  editor.update(
    () => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection)) {
        throw new Error('Expected a range selection')
      }

      selection.anchor.getNode().selectEnd()
    },
    { discrete: true },
  )
}

/**
 * Enter copies the caret format onto the new paragraph. In the browser, the
 * selection handler then copies that empty block's text format back onto the
 * caret, which is why toggling the format off does not stick. Headless editors
 * do not emit that selection change, so the test applies the same copy.
 */
function restoreCaretFormatFromEmptyBlock({ editor }: { editor: LexicalEditor }) {
  editor.update(
    () => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection) || selection.anchor.type !== 'element') {
        throw new Error('Expected a caret on an empty block')
      }

      const anchorNode = selection.anchor.getNode()

      if (!$isElementNode(anchorNode)) {
        throw new Error('Expected an element node')
      }

      selection.setFormat(anchorNode.getTextFormat())
    },
    { discrete: true },
  )
}

function startLineWithInheritedStrikethrough({ editor }: { editor: LexicalEditor }) {
  type({ editor, text: 'strike' })
  selectCurrentText({ editor })
  toggleFormat({ editor, format: 'strikethrough' })
  collapseToEnd({ editor })
  pressEnter({ editor })
}

/**
 * Paragraph whose formatted text already follows the caret. The checklist
 * shortcut is typed in a plain run in front of that text.
 */
function placeCaretBeforeFormattedText({ editor }: { editor: LexicalEditor }) {
  editor.update(
    () => {
      const paragraph = $createParagraphNode()
      const bold = $createTextNode('bold')
      const italic = $createTextNode('italic')

      bold.toggleFormat('bold')
      italic.toggleFormat('italic')
      paragraph.append(bold, italic)
      $getRoot().clear().append(paragraph)
      paragraph.selectStart()

      const selection = $getSelection()

      if (!$isRangeSelection(selection)) {
        throw new Error('Expected a range selection')
      }

      selection.setFormat(0)
    },
    { discrete: true },
  )
}

type TextPartSnapshot = {
  bold: boolean
  italic: boolean
  text: string
}

function readListItemTextParts({ editor }: { editor: LexicalEditor }): TextPartSnapshot[] {
  let parts: TextPartSnapshot[] | undefined

  editor.getEditorState().read(() => {
    const list = $getRoot().getChildren().find($isListNode)

    if (!$isListNode(list)) {
      throw new Error('Expected a list')
    }

    const listItem = list.getFirstChild()

    if (!$isListItemNode(listItem)) {
      throw new Error('Expected a list item')
    }

    parts = listItem
      .getChildren()
      .filter($isTextNode)
      .map((node: TextNode) => ({
        bold: node.hasFormat('bold'),
        italic: node.hasFormat('italic'),
        text: node.getTextContent(),
      }))
  })

  if (parts === undefined) {
    throw new Error('Expected list item text')
  }

  return parts
}

type ListItemSnapshot = {
  checked: boolean | undefined
  listItemTextFormat: number
  listType: string
  selectionHasStrikethrough: boolean
  text: string
  textHasBold: boolean
  textHasStrikethrough: boolean
}

function readFirstListItem({ editor }: { editor: LexicalEditor }): ListItemSnapshot {
  let snapshot: ListItemSnapshot | undefined

  editor.getEditorState().read(() => {
    const list = $getRoot().getChildren().find($isListNode)

    if (!$isListNode(list)) {
      throw new Error('Expected a list')
    }

    const listItem = list.getFirstChild()

    if (!$isListItemNode(listItem)) {
      throw new Error('Expected a list item')
    }

    const textNodes = listItem.getChildren().filter($isTextNode)
    const selection = $getSelection()

    snapshot = {
      checked: listItem.getChecked(),
      listItemTextFormat: listItem.getTextFormat(),
      listType: list.getListType(),
      selectionHasStrikethrough: $isRangeSelection(selection)
        ? selection.hasFormat('strikethrough')
        : false,
      text: textNodes.map((node: TextNode) => node.getTextContent()).join(''),
      textHasBold: textNodes.some((node: TextNode) => node.hasFormat('bold')),
      textHasStrikethrough: textNodes.some((node: TextNode) => node.hasFormat('strikethrough')),
    }
  })

  if (snapshot === undefined) {
    throw new Error('Expected a list item snapshot')
  }

  return snapshot
}

function previousLineIsStruck({ editor }: { editor: LexicalEditor }): boolean {
  let isStruck = false

  editor.getEditorState().read(() => {
    const paragraph = $getRoot().getFirstChild()

    if (!$isElementNode(paragraph)) {
      throw new Error('Expected a paragraph')
    }

    isStruck = paragraph
      .getChildren()
      .some((node) => $isTextNode(node) && node.hasFormat('strikethrough'))
  })

  return isStruck
}

async function flushMarkdownShortcut() {
  await new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

describe('checklist markdown shortcut', () => {
  it('should not carry strikethrough from the previous line into a typed checklist', async () => {
    const editor = createTestEditor()

    startLineWithInheritedStrikethrough({ editor })
    type({ editor, text: '[x] Task' })
    await flushMarkdownShortcut()

    const item = readFirstListItem({ editor })

    expect(previousLineIsStruck({ editor })).toBe(true)
    expect(item.listType).toBe('check')
    expect(item.checked).toBe(true)
    expect(item.text).toBe('Task')
    expect(item.textHasStrikethrough).toBe(false)
    expect(item.listItemTextFormat).toBe(0)
    expect(item.selectionHasStrikethrough).toBe(false)
  })

  it('should not carry strikethrough into a checklist after the format was toggled off', async () => {
    const editor = createTestEditor()

    startLineWithInheritedStrikethrough({ editor })
    toggleFormat({ editor, format: 'strikethrough' })
    restoreCaretFormatFromEmptyBlock({ editor })
    type({ editor, text: '[x] Task' })
    await flushMarkdownShortcut()

    const item = readFirstListItem({ editor })

    expect(item.listType).toBe('check')
    expect(item.checked).toBe(true)
    expect(item.text).toBe('Task')
    expect(item.textHasStrikethrough).toBe(false)
    expect(item.listItemTextFormat).toBe(0)
    expect(item.selectionHasStrikethrough).toBe(false)
  })

  it('should create an unchecked checklist without an inherited format', async () => {
    const editor = createTestEditor()

    startLineWithInheritedStrikethrough({ editor })
    type({ editor, text: '[ ] Task' })
    await flushMarkdownShortcut()

    const item = readFirstListItem({ editor })

    expect(item.listType).toBe('check')
    expect(item.checked).toBe(false)
    expect(item.text).toBe('Task')
    expect(item.textHasStrikethrough).toBe(false)
    expect(item.selectionHasStrikethrough).toBe(false)
  })

  it('should keep pre-existing bold and italic text when the checklist shortcut is typed before it', async () => {
    const editor = createTestEditor()

    placeCaretBeforeFormattedText({ editor })
    type({ editor, text: '[ ] ' })
    await flushMarkdownShortcut()

    expect(readListItemTextParts({ editor })).toEqual([
      { bold: true, italic: false, text: 'bold' },
      { bold: false, italic: true, text: 'italic' },
    ])
  })

  it('should still apply formatting typed after the checklist item exists', async () => {
    const editor = createTestEditor()

    startLineWithInheritedStrikethrough({ editor })
    type({ editor, text: '[x] ' })
    await flushMarkdownShortcut()
    type({ editor, text: '**bold**' })
    await flushMarkdownShortcut()

    const item = readFirstListItem({ editor })

    expect(item.text).toBe('bold')
    expect(item.textHasBold).toBe(true)
    expect(item.textHasStrikethrough).toBe(false)
    expect(item.selectionHasStrikethrough).toBe(false)
  })

  it('should still create a bullet list from the markdown shortcut', async () => {
    const editor = createTestEditor()

    startLineWithInheritedStrikethrough({ editor })
    type({ editor, text: '- item' })
    await flushMarkdownShortcut()

    const item = readFirstListItem({ editor })

    expect(item.listType).toBe('bullet')
    expect(item.text).toBe('item')
  })

  it('should still create a numbered list from the markdown shortcut', async () => {
    const editor = createTestEditor()

    startLineWithInheritedStrikethrough({ editor })
    type({ editor, text: '1. item' })
    await flushMarkdownShortcut()

    const item = readFirstListItem({ editor })

    expect(item.listType).toBe('number')
    expect(item.text).toBe('item')
  })

  it('should still insert a checklist from the slash menu command', async () => {
    const editor = createTestEditor()

    startLineWithInheritedStrikethrough({ editor })
    editor.update(
      () => {
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
      },
      { discrete: true },
    )
    type({ editor, text: 'Task' })

    const item = readFirstListItem({ editor })

    expect(item.listType).toBe('check')
    expect(item.checked).toBe(false)
    expect(item.text).toBe('Task')
  })

  it('should keep intentional formatting when a checklist is imported from markdown', () => {
    const editor = createTestEditor()

    editor.update(
      () => {
        const paragraph = $createParagraphNode()
        const text = $createTextNode('bold task')

        text.toggleFormat('bold')
        paragraph.append(text)
        $getRoot().clear().append(paragraph)
        PAYLOAD_CHECK_LIST.replace(
          paragraph,
          paragraph.getChildren(),
          ['- [x] ', '', '[x]', 'x'],
          true,
        )
      },
      { discrete: true },
    )

    const item = readFirstListItem({ editor })

    expect(item.checked).toBe(true)
    expect(item.text).toBe('bold task')
    expect(item.textHasBold).toBe(true)
  })

  it('should import and export checklist markdown', () => {
    const editor = createTestEditor()

    editor.update(
      () => {
        $convertFromMarkdownString('- [x] **bold**', [PAYLOAD_CHECK_LIST, BOLD_STAR])
      },
      { discrete: true },
    )

    const item = readFirstListItem({ editor })

    expect(item.checked).toBe(true)
    expect(item.text).toBe('bold')
    expect(item.textHasBold).toBe(true)
    expect(item.textHasStrikethrough).toBe(false)

    let markdown = ''

    editor.getEditorState().read(() => {
      markdown = $convertToMarkdownString([PAYLOAD_CHECK_LIST, BOLD_STAR])
    })

    expect(markdown).toBe('- [x] **bold**')
  })
})
