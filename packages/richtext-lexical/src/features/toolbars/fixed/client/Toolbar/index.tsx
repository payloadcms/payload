'use client'
import type { LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { useScrollInfo, useThrottledEffect, useTranslation } from '@payloadcms/ui'
import * as React from 'react'
import { useMemo } from 'react'

import type { EditorConfigContextType } from '../../../../../lexical/config/client/EditorConfigProvider.js'
import type { SanitizedClientEditorConfig } from '../../../../../lexical/config/types.js'
import type { PluginComponent } from '../../../../typesClient.js'
import type { ToolbarStates } from '../../../shared/useToolbarStates.js'
import type { ToolbarGroup, ToolbarGroupItem } from '../../../types.js'
import type { FixedToolbarFeatureProps } from '../../server/index.js'

import { useEditorConfigContext } from '../../../../../lexical/config/client/EditorConfigProvider.js'
import { ToolbarButton } from '../../../shared/ToolbarButton/index.js'
import { ToolbarDropdown } from '../../../shared/ToolbarDropdown/index.js'
import { useToolbarStates } from '../../../shared/useToolbarStates.js'
import './index.scss'

function ButtonGroupItem({
  active,
  anchorElem,
  editor,
  enabled,
  item,
}: {
  active: boolean
  anchorElem: HTMLElement
  editor: LexicalEditor
  enabled: boolean
  item: ToolbarGroupItem
}): React.ReactNode {
  if (item.Component) {
    return (
      item?.Component && (
        <item.Component anchorElem={anchorElem} editor={editor} item={item} key={item.key} />
      )
    )
  }

  if (!item.ChildComponent) {
    return null
  }

  return (
    <ToolbarButton active={active} editor={editor} enabled={enabled} item={item} key={item.key}>
      <item.ChildComponent />
    </ToolbarButton>
  )
}

function ToolbarGroupComponent({
  anchorElem,
  editor,
  editorConfig,
  group,
  index,
  toolbarStates,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  editorConfig: SanitizedClientEditorConfig
  group: ToolbarGroup
  index: number
  toolbarStates: ToolbarStates
}): React.ReactNode {
  const { i18n } = useTranslation<{}, string>()
  const {
    fieldProps: { featureClientSchemaMap, schemaPath },
  } = useEditorConfigContext()

  const groupState = toolbarStates.groupStates.get(group.key)

  const DropdownIcon = useMemo(() => {
    if (group.type !== 'dropdown') {
      return undefined
    }
    const activeItem = groupState?.activeItems?.[0]
    if (activeItem) {
      return activeItem.ChildComponent
    }
    return group.ChildComponent
  }, [group, groupState?.activeItems])

  const dropdownLabel = useMemo(() => {
    if (group.type !== 'dropdown') {
      return undefined
    }
    const activeItems = groupState?.activeItems
    if (!activeItems?.length) {
      return undefined
    }
    if (activeItems.length > 1) {
      return i18n.t('lexical:general:toolbarItemsActive', { count: activeItems.length })
    }
    const item = activeItems[0]!
    let label = item.key
    if (item.label) {
      label =
        typeof item.label === 'function'
          ? item.label({ featureClientSchemaMap, i18n, schemaPath })
          : item.label
    }
    if (label.length > 25) {
      label = label.substring(0, 25) + '...'
    }
    return label
  }, [group, groupState?.activeItems, i18n, featureClientSchemaMap, schemaPath])

  return (
    <div
      className={`fixed-toolbar__group fixed-toolbar__group-${group.key}`}
      data-toolbar-group-key={group.key}
      key={group.key}
    >
      {group.type === 'dropdown' && group.items.length && groupState ? (
        <ToolbarDropdown
          anchorElem={anchorElem}
          editor={editor}
          group={group}
          groupState={groupState}
          Icon={DropdownIcon}
          itemsContainerClassNames={['fixed-toolbar__dropdown-items']}
          label={dropdownLabel}
        />
      ) : null}
      {group.type === 'buttons' && group.items.length
        ? group.items.map((item) => {
            const itemState = toolbarStates.itemStates.get(item.key)
            return (
              <ButtonGroupItem
                active={itemState?.active ?? false}
                anchorElem={anchorElem}
                editor={editor}
                enabled={itemState?.enabled ?? true}
                item={item}
                key={item.key}
              />
            )
          })
        : null}
      {index < editorConfig.features.toolbarFixed?.groups.length - 1 && <div className="divider" />}
    </div>
  )
}

function FixedToolbar({
  anchorElem,
  clientProps,
  editor,
  editorConfig,
  parentWithFixedToolbar,
}: {
  anchorElem: HTMLElement
  clientProps?: FixedToolbarFeatureProps
  editor: LexicalEditor
  editorConfig: SanitizedClientEditorConfig
  parentWithFixedToolbar: EditorConfigContextType | false
}): React.ReactNode {
  const currentToolbarRef = React.useRef<HTMLDivElement>(null)
  const isEditable = useLexicalEditable()

  const { y } = useScrollInfo()

  const toolbarStates = useToolbarStates(editor, editorConfig?.features?.toolbarFixed?.groups)

  // Memoize the parent toolbar element
  const parentToolbarElem = useMemo(() => {
    if (!parentWithFixedToolbar || clientProps?.disableIfParentHasFixedToolbar) {
      return null
    }

    const parentEditorElem = parentWithFixedToolbar.editorContainerRef.current
    let sibling = parentEditorElem.previousElementSibling
    while (sibling) {
      if (sibling.classList.contains('fixed-toolbar')) {
        return sibling
      }
      sibling = sibling.previousElementSibling
    }
    return null
  }, [clientProps?.disableIfParentHasFixedToolbar, parentWithFixedToolbar])

  useThrottledEffect(
    () => {
      if (!parentToolbarElem) {
        // this also checks for clientProps?.disableIfParentHasFixedToolbar indirectly, see the parentToolbarElem useMemo
        return
      }
      const currentToolbarElem = currentToolbarRef.current
      if (!currentToolbarElem) {
        return
      }

      const currentRect = currentToolbarElem.getBoundingClientRect()
      const parentRect = parentToolbarElem.getBoundingClientRect()

      // we only need to check for vertical overlap
      const overlapping = !(
        currentRect.bottom < parentRect.top || currentRect.top > parentRect.bottom
      )

      if (overlapping) {
        currentToolbarElem.classList.remove('fixed-toolbar')
        currentToolbarElem.classList.add('fixed-toolbar', 'fixed-toolbar--overlapping')
        parentToolbarElem.classList.remove('fixed-toolbar')
        parentToolbarElem.classList.add('fixed-toolbar', 'fixed-toolbar--hide')
      } else {
        if (!currentToolbarElem.classList.contains('fixed-toolbar--overlapping')) {
          return
        }
        currentToolbarElem.classList.remove('fixed-toolbar--overlapping')
        currentToolbarElem.classList.add('fixed-toolbar')
        parentToolbarElem.classList.remove('fixed-toolbar--hide')
        parentToolbarElem.classList.add('fixed-toolbar')
      }
    },
    50,
    [currentToolbarRef, parentToolbarElem, y],
  )

  return (
    <div
      className="fixed-toolbar"
      onFocus={(event) => {
        // Prevent other focus events being triggered. Otherwise, if this was to be clicked while in a child editor,
        // the parent editor will be focused, and the child editor will lose focus.
        event.stopPropagation()
      }}
      ref={currentToolbarRef}
    >
      {isEditable && (
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
                  toolbarStates={toolbarStates}
                />
              )
            })}
        </React.Fragment>
      )}
    </div>
  )
}

const getParentEditorWithFixedToolbar = (
  editorConfigContext: EditorConfigContextType,
): EditorConfigContextType | false => {
  if (editorConfigContext.parentEditor?.editorConfig) {
    if (editorConfigContext.parentEditor?.editorConfig.resolvedFeatureMap.has('toolbarFixed')) {
      return editorConfigContext.parentEditor
    } else {
      if (editorConfigContext.parentEditor) {
        return getParentEditorWithFixedToolbar(editorConfigContext.parentEditor)
      }
    }
  }
  return false
}

export const FixedToolbarPlugin: PluginComponent<FixedToolbarFeatureProps> = ({ clientProps }) => {
  const [currentEditor] = useLexicalComposerContext()
  const editorConfigContext = useEditorConfigContext()
  const isEditable = useLexicalEditable()
  if (!isEditable) {
    return null
  }

  const { editorConfig: currentEditorConfig } = editorConfigContext

  const editor = clientProps.applyToFocusedEditor
    ? editorConfigContext.focusedEditor?.editor || currentEditor
    : currentEditor

  const editorConfig = clientProps.applyToFocusedEditor
    ? editorConfigContext.focusedEditor?.editorConfig || currentEditorConfig
    : currentEditorConfig

  const parentWithFixedToolbar = getParentEditorWithFixedToolbar(editorConfigContext)

  if (clientProps?.disableIfParentHasFixedToolbar) {
    if (parentWithFixedToolbar) {
      return null
    }
  }

  if (!editorConfig?.features?.toolbarFixed?.groups?.length) {
    return null
  }

  return (
    <FixedToolbar
      anchorElem={document.body}
      clientProps={clientProps}
      editor={editor}
      editorConfig={editorConfig}
      parentWithFixedToolbar={parentWithFixedToolbar}
    />
  )
}
