'use client'
import type { LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import * as React from 'react'

import type { FixedToolbarGroup, FixedToolbarGroupItem } from '../types.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { ToolbarButton } from '../../../../lexical/plugins/toolbars/ToolbarButton/index.js'
import { ToolbarDropdown } from '../../../../lexical/plugins/toolbars/ToolbarDropdown/index.js'
import './index.scss'

function ButtonGroupItem({
  anchorElem,
  editor,
  item,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  item: FixedToolbarGroupItem
}): React.ReactNode {
  if (item.Component) {
    return (
      item?.Component && (
        <item.Component anchorElem={anchorElem} editor={editor} item={item} key={item.key} />
      )
    )
  }

  return (
    <ToolbarButton item={item} key={item.key}>
      {item?.ChildComponent && <item.ChildComponent />}
    </ToolbarButton>
  )
}

function ToolbarGroup({
  anchorElem,
  editor,
  group,
  index,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  group: FixedToolbarGroup
  index: number
}): React.ReactNode {
  const { editorConfig } = useEditorConfigContext()

  const Icon =
    group?.type === 'dropdown' && group.items.length && group.ChildComponent
      ? group.ChildComponent
      : null

  return (
    <div className={`fixed-toolbar__group fixed-toolbar__group-${group.key}`} key={group.key}>
      {group.type === 'dropdown' &&
        group.items.length &&
        (Icon ? (
          <ToolbarDropdown
            Icon={Icon}
            anchorElem={anchorElem}
            editor={editor}
            groupKey={group.key}
            items={group.items}
          />
        ) : (
          <ToolbarDropdown
            anchorElem={anchorElem}
            editor={editor}
            groupKey={group.key}
            items={group.items}
          />
        ))}
      {group.type === 'buttons' &&
        group.items.length &&
        group.items.map((item) => {
          return (
            <ButtonGroupItem anchorElem={anchorElem} editor={editor} item={item} key={item.key} />
          )
        })}
      {index < editorConfig.features.toolbarInline?.groups.length - 1 && (
        <div className="divider" />
      )}
    </div>
  )
}

function FloatingSelectToolbar({
  anchorElem,
  editor,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
}): React.ReactNode {
  const { editorConfig } = useEditorConfigContext()

  return (
    <div className="fixed-toolbar">
      {editor.isEditable() && (
        <React.Fragment>
          {editorConfig?.features &&
            editorConfig.features?.toolbarInline?.groups.map((group, i) => {
              return (
                <ToolbarGroup
                  anchorElem={anchorElem}
                  editor={editor}
                  group={group}
                  index={i}
                  key={group.key}
                />
              )
            })}
        </React.Fragment>
      )}
    </div>
  )
}

export function FixedToolbarPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): React.ReactElement | null {
  const [editor] = useLexicalComposerContext()
  return <FloatingSelectToolbar anchorElem={anchorElem} editor={editor} />
}
