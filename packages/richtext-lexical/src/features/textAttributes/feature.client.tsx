'use client'

import type { LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $patchStyleText } from '@lexical/selection'
import { $isTableSelection } from '@lexical/table'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  TextNode,
} from 'lexical'
import { useEffect } from 'react'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextAttributesFeatureProps } from './feature.server.js'

import { TextColorIcon } from '../../lexical/ui/icons/TextColor/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'

const toolbarGroups = (colors: TextAttributesFeatureProps['colors']): ToolbarGroup[] => {
  const items: ToolbarDropdownGroup['items'] = colors.map((color) => {
    return {
      ChildComponent: TextColorIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          // return selection.hasFormat('bold') // TO-DO: fix this
        }
        return false
      },
      key: color.label,
      label: color.label,
      onSelect: ({ editor }) => {
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return
          }
          $patchStyleText(selection, { color: color.value })
        })
      },
      order: 1,
    }
  })
  return [
    {
      type: 'dropdown',
      ChildComponent: TextColorIcon,
      items,
      key: 'textAttributes',
      order: 30,
    },
  ]
}

export const TextAttributesFeatureClient = createClientFeature<TextAttributesFeatureProps>(
  ({ props }) => {
    console.log('props', props)
    const { colors } = props
    return {
      plugins: [
        {
          Component: MyPlugin,
          position: 'normal',
        },
      ],
      toolbarFixed: {
        groups: toolbarGroups(colors),
      },
      toolbarInline: {
        groups: toolbarGroups(colors),
      },
    }
  },
)

const SET_TEXT_STYLES = createCommand<{
  others: 'keep' | 'remove'
  styles: Record<string, string>
}>('SET_TEXT_STYLES')

function patchToColor(color: string, editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) {
      return
    }
    $patchStyleText(selection, { color })
  })
}

type Styles = {
  [key: string]: string
  others: 'keep' | 'remove'
}

function setStyles(editor: LexicalEditor, styles: Styles) {}
const editor = '' as unknown as LexicalEditor

setStyles(editor, { others: 'keep' })

function MyPlugin() {
  const [editor] = useLexicalComposerContext()

  editor.dispatchCommand(SET_TEXT_STYLES, { others: 'keep', styles: { color: 'red' } })

  useEffect(() => {
    return editor.registerCommand(
      SET_TEXT_STYLES,
      (payload) => {
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return
          }
          console.log(styles)
          // $patchStyleText(selection, styles)
        })
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={() => patchToColor('red', editor)} type="button">
        Change color to red
      </button>
      <button onClick={() => patchToColor('green', editor)} type="button">
        Change color to green
      </button>
      <button
        onClick={() => {
          editor.read(() => {
            editor._editorState._nodeMap.forEach((node) => {
              if (node instanceof TextNode) {
                console.log(JSON.stringify(node.exportJSON()))
              }
            })
            // console.log(editor.getEditorState().toJSON())
            // console.log(JSON.stringify(editor.getEditorState().toJSON()))
          })
        }}
        type="button"
      >
        Print editor state
      </button>
    </div>
  )
}
