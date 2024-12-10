'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useTranslation } from '@payloadcms/ui'
import { useCallback, useMemo, useState } from 'react'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import type {
  SlashMenuGroup,
  SlashMenuGroupInternal,
  SlashMenuItemInternal,
  SlashMenuItem as SlashMenuItemType,
} from './LexicalTypeaheadMenuPlugin/types.js'

import { useEditorConfigContext } from '../../config/client/EditorConfigProvider.js'
import './index.scss'
import { LexicalTypeaheadMenuPlugin } from './LexicalTypeaheadMenuPlugin/index.js'
import { useMenuTriggerMatch } from './useMenuTriggerMatch.js'

const baseClass = 'slash-menu-popup'

function SlashMenuItem({
  isSelected,
  item,
  onClick,
  onMouseEnter,
  ref,
}: {
  index: number
  isSelected: boolean
  item: SlashMenuItemInternal
  onClick: () => void
  onMouseEnter: () => void
  ref?: React.Ref<HTMLButtonElement>
}) {
  const {
    fieldProps: { featureClientSchemaMap, schemaPath },
  } = useEditorConfigContext()

  const { i18n } = useTranslation<{}, string>()

  let className = `${baseClass}__item ${baseClass}__item-${item.key}`
  if (isSelected) {
    className += ` ${baseClass}__item--selected`
  }

  let title = item.key
  if (item.label) {
    title =
      typeof item.label === 'function'
        ? item.label({ featureClientSchemaMap, i18n, schemaPath })
        : item.label
  }
  // Crop title to max. 25 characters
  if (title.length > 25) {
    title = title.substring(0, 25) + '...'
  }

  return (
    <button
      aria-selected={isSelected}
      className={className}
      id={baseClass + '__item-' + item.key}
      key={item.key}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      ref={ref}
      role="option"
      tabIndex={-1}
      type="button"
    >
      {item?.Icon && <item.Icon />}

      <span className={`${baseClass}__item-text`}>{title}</span>
    </button>
  )
}

export function SlashMenuPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): React.ReactElement {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<null | string>(null)
  const { editorConfig } = useEditorConfigContext()
  const { i18n } = useTranslation<{}, string>()
  const {
    fieldProps: { featureClientSchemaMap, schemaPath },
  } = useEditorConfigContext()

  const checkForTriggerMatch = useMenuTriggerMatch('/', {
    minLength: 0,
  })

  const getDynamicItems = useCallback(() => {
    let groupWithItems: Array<SlashMenuGroup> = []

    for (const dynamicItem of editorConfig.features.slashMenu.dynamicGroups) {
      if (queryString) {
        const dynamicGroupWithItems = dynamicItem({
          editor,
          queryString,
        })
        groupWithItems = groupWithItems.concat(dynamicGroupWithItems)
      }
    }

    return groupWithItems
  }, [editor, queryString, editorConfig?.features])

  const groups: SlashMenuGroup[] = useMemo(() => {
    let groupsWithItems: SlashMenuGroup[] = []
    for (const groupWithItem of editorConfig?.features.slashMenu.groups ?? []) {
      groupsWithItems.push(groupWithItem)
    }

    if (queryString) {
      // Filter current groups first
      // @ts-expect-error - TODO: fix this
      groupsWithItems = groupsWithItems.map((group) => {
        const filteredItems = group.items.filter((item) => {
          let itemTitle = item.key
          if (item.label) {
            itemTitle =
              typeof item.label === 'function'
                ? item.label({ featureClientSchemaMap, i18n, schemaPath })
                : item.label
          }

          if (new RegExp(queryString, 'gi').exec(itemTitle)) {
            return true
          }
          if (item.keywords != null) {
            return item.keywords.some((keyword) => new RegExp(queryString, 'gi').exec(keyword))
          }
          return false
        })
        if (filteredItems.length) {
          return {
            ...group,
            items: filteredItems,
          }
        }
        return null
      })

      groupsWithItems = groupsWithItems.filter((group) => group != null)

      // Now add dynamic groups
      const dynamicItemGroups = getDynamicItems()

      // merge dynamic items into groups
      for (const dynamicGroup of dynamicItemGroups) {
        // 1. find the group with the same name or create new one
        let group = groupsWithItems.find((group) => group.key === dynamicGroup.key)
        if (!group) {
          group = {
            ...dynamicGroup,
            items: [],
          }
        } else {
          groupsWithItems = groupsWithItems.filter((group) => group.key !== dynamicGroup.key)
        }

        // 2. Add items to group items array and add to sanitized.slashMenu.groupsWithItems
        if (group?.items?.length) {
          group.items = group.items.concat(group.items)
        }
        groupsWithItems.push(group)
      }
    }

    return groupsWithItems
  }, [
    queryString,
    editorConfig?.features.slashMenu.groups,
    getDynamicItems,
    featureClientSchemaMap,
    i18n,
    schemaPath,
  ])

  return (
    <LexicalTypeaheadMenuPlugin
      anchorElem={anchorElem}
      groups={groups as SlashMenuGroupInternal[]}
      menuRenderFn={(
        anchorElementRef,
        { selectedItemKey, selectItemAndCleanUp, setSelectedItemKey },
      ) =>
        anchorElementRef.current && groups.length
          ? ReactDOM.createPortal(
              <div className={baseClass}>
                {groups.map((group) => {
                  let groupTitle = group.key
                  if (group.label && featureClientSchemaMap) {
                    groupTitle =
                      typeof group.label === 'function'
                        ? group.label({ featureClientSchemaMap, i18n, schemaPath })
                        : group.label
                  }

                  return (
                    <div
                      className={`${baseClass}__group ${baseClass}__group-${group.key}`}
                      key={group.key}
                    >
                      <div className={`${baseClass}__group-title`}>{groupTitle}</div>
                      {group.items.map((item, oi: number) => (
                        <SlashMenuItem
                          index={oi}
                          isSelected={selectedItemKey === item.key}
                          item={item as SlashMenuItemInternal}
                          key={item.key}
                          onClick={() => {
                            setSelectedItemKey(item.key)
                            selectItemAndCleanUp(item)
                          }}
                          onMouseEnter={() => {
                            setSelectedItemKey(item.key)
                          }}
                          ref={(el) => {
                            ;(item as SlashMenuItemInternal).ref = { current: el }
                          }}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>,
              anchorElementRef.current,
            )
          : null
      }
      onQueryChange={setQueryString}
      triggerFn={checkForTriggerMatch}
    />
  )
}
