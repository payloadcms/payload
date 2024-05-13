'use client'
import type { LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import * as React from 'react'

import type { EditorFocusContextType } from '../../../../lexical/EditorFocusProvider.js'
import type { SanitizedClientEditorConfig } from '../../../../lexical/config/types.js'
import type { PluginComponentWithAnchor } from '../../../types.js'
import type { ToolbarGroup, ToolbarGroupItem } from '../../types.js'

import { useEditorFocus } from '../../../../lexical/EditorFocusProvider.js'
import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { ToolbarButton } from '../../shared/ToolbarButton/index.js'
import { ToolbarDropdown } from '../../shared/ToolbarDropdown/index.js'
import './index.scss'

function ButtonGroupItem({
  anchorElem,
  editor,
  item,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  item: ToolbarGroupItem
}): React.ReactNode {
  if (item.Component) {
    return (
      item?.Component && (
        <item.Component anchorElem={anchorElem} editor={editor} item={item} key={item.key} />
      )
    )
  }

  return (
    <ToolbarButton editor={editor} item={item} key={item.key}>
      {item?.ChildComponent && <item.ChildComponent />}
    </ToolbarButton>
  )
}

function ToolbarGroupComponent({
  anchorElem,
  editor,
  editorConfig,
  group,
  index,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  editorConfig: SanitizedClientEditorConfig
  group: ToolbarGroup
  index: number
}): React.ReactNode {
  const { i18n } = useTranslation()

  const [dropdownLabel, setDropdownLabel] = React.useState<null | string>(null)
  const [DropdownIcon, setDropdownIcon] = React.useState<React.FC | null>(null)

  React.useEffect(() => {
    if (group?.type === 'dropdown' && group.items.length && group.ChildComponent) {
      setDropdownIcon(() => group.ChildComponent)
    } else {
      setDropdownIcon(null)
    }
  }, [group])

  const onActiveChange = ({ activeItems }: { activeItems: ToolbarGroupItem[] }) => {
    if (!activeItems.length) {
      if (group?.type === 'dropdown' && group.items.length && group.ChildComponent) {
        setDropdownIcon(() => group.ChildComponent)
        setDropdownLabel(null)
      } else {
        setDropdownIcon(null)
        setDropdownLabel(null)
      }
      return
    }
    const item = activeItems[0]

    let label = item.key
    if (item.label) {
      label = typeof item.label === 'function' ? item.label({ i18n }) : item.label
    }
    // Crop title to max. 25 characters
    if (label.length > 25) {
      label = label.substring(0, 25) + '...'
    }
    setDropdownLabel(label)
    setDropdownIcon(() => item.ChildComponent)
  }

  return (
    <div className={`fixed-toolbar__group fixed-toolbar__group-${group.key}`} key={group.key}>
      {group.type === 'dropdown' &&
        group.items.length &&
        (DropdownIcon ? (
          <ToolbarDropdown
            Icon={DropdownIcon}
            anchorElem={anchorElem}
            editor={editor}
            groupKey={group.key}
            items={group.items}
            itemsContainerClassNames={['fixed-toolbar__dropdown-items']}
            label={dropdownLabel}
            maxActiveItems={1}
            onActiveChange={onActiveChange}
          />
        ) : (
          <ToolbarDropdown
            anchorElem={anchorElem}
            editor={editor}
            groupKey={group.key}
            items={group.items}
            itemsContainerClassNames={['fixed-toolbar__dropdown-items']}
            label={dropdownLabel}
            maxActiveItems={1}
            onActiveChange={onActiveChange}
          />
        ))}
      {group.type === 'buttons' &&
        group.items.length &&
        group.items.map((item) => {
          return (
            <ButtonGroupItem anchorElem={anchorElem} editor={editor} item={item} key={item.key} />
          )
        })}
      {index < editorConfig.features.toolbarFixed?.groups.length - 1 && <div className="divider" />}
    </div>
  )
}

function FixedToolbar({
  anchorElem,
  editor,
  editorConfig,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  editorConfig: SanitizedClientEditorConfig
}): React.ReactNode {
  return (
    <div
      className="fixed-toolbar"
      onFocus={(event) => {
        // Prevent other focus events being triggered. Otherwise, if this was to be clicked while in a child editor,
        // the parent editor will be focused, and the child editor will lose focus.
        event.stopPropagation()
      }}
    >
      {editor.isEditable() && (
        <React.Fragment>
          {editorConfig?.features &&
            editorConfig.features?.toolbarFixed?.groups.map((group, i) => {
              return (
                <ToolbarGroupComponent
                  anchorElem={anchorElem}
                  editor={editor}
                  editorConfig={editorConfig}
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

const checkParentEditor = (editorFocus: EditorFocusContextType): boolean => {
  if (editorFocus.parentEditorConfigContext?.editorConfig) {
    if (
      editorFocus.parentEditorConfigContext?.editorConfig.resolvedFeatureMap.has('toolbarFixed')
    ) {
      return true
    } else {
      if (editorFocus.parentEditorFocus) {
        return checkParentEditor(editorFocus.parentEditorFocus)
      }
    }
  }
  return false
}

export const FixedToolbarPlugin: PluginComponentWithAnchor<undefined> = ({ anchorElem }) => {
  const [currentEditor] = useLexicalComposerContext()
  const { editorConfig: currentEditorConfig, uuid } = useEditorConfigContext()

  const editorFocus = useEditorFocus()
  const editor = editorFocus.focusedEditor || currentEditor

  const editorConfig = editorFocus.focusedEditorConfigContext?.editorConfig || currentEditorConfig

  // Check if there is a parent editor with a fixed toolbar already
  const hasParentWithFixedToolbar = checkParentEditor(editorFocus)

  if (hasParentWithFixedToolbar) {
    return null
  }

  if (!editorConfig?.features?.toolbarFixed?.groups?.length) {
    return null
  }

  return <FixedToolbar anchorElem={anchorElem} editor={editor} editorConfig={editorConfig} />
}
