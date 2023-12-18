'use client'
import type { TextNode } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useMemo, useState } from 'react'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'

import type { SlashMenuGroup, SlashMenuOption } from './LexicalTypeaheadMenuPlugin/types'

import { useEditorConfigContext } from '../../config/EditorConfigProvider'
import { LexicalTypeaheadMenuPlugin } from './LexicalTypeaheadMenuPlugin'
import './index.scss'
import { useMenuTriggerMatch } from './useMenuTriggerMatch'

const baseClass = 'slash-menu-popup'

function SlashMenuItem({
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
  option: SlashMenuOption
}) {
  const { i18n } = useTranslation('fields')

  let className = `${baseClass}__item ${baseClass}__item-${option.key}`
  if (isSelected) {
    className += ` ${baseClass}__item--selected`
  }

  let title = option.key
  if (option.displayName) {
    title =
      typeof option.displayName === 'function' ? option.displayName({ i18n }) : option.displayName
  }
  // Crop title to max. 50 characters
  if (title.length > 25) {
    title = title.substring(0, 25) + '...'
  }

  const LazyIcon = useMemo(() => {
    return option?.Icon
      ? React.lazy(() =>
          option.Icon().then((resolvedIcon) => ({
            default: resolvedIcon,
          })),
        )
      : null
  }, [option])

  return (
    <button
      aria-selected={isSelected}
      className={className}
      id={baseClass + '__item-' + option.key}
      key={option.key}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      ref={option.setRefElement}
      role="option"
      tabIndex={-1}
      type="button"
    >
      {LazyIcon && (
        <React.Suspense>
          <LazyIcon />
        </React.Suspense>
      )}

      <span className={`${baseClass}__item-text`}>{title}</span>
    </button>
  )
}

export function SlashMenuPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<null | string>(null)
  const { editorConfig } = useEditorConfigContext()
  const { i18n } = useTranslation('fields')

  const checkForTriggerMatch = useMenuTriggerMatch('/', {
    minLength: 0,
  })

  const getDynamicOptions = useCallback(() => {
    let groupWithOptions: Array<SlashMenuGroup> = []

    for (const dynamicOption of editorConfig.features.slashMenu.dynamicOptions) {
      const dynamicGroupWithOptions = dynamicOption({
        editor,
        queryString,
      })
      groupWithOptions = groupWithOptions.concat(dynamicGroupWithOptions)
    }

    return groupWithOptions
  }, [editor, queryString, editorConfig?.features])

  const groups: SlashMenuGroup[] = useMemo(() => {
    let groupsWithOptions: SlashMenuGroup[] = []
    for (const groupWithOption of editorConfig?.features.slashMenu.groupsWithOptions ?? []) {
      groupsWithOptions.push(groupWithOption)
    }

    if (queryString) {
      // Filter current groups first
      groupsWithOptions = groupsWithOptions.map((group) => {
        const filteredOptions = group.options.filter((option) => {
          let optionTitle = option.key
          if (option.displayName) {
            optionTitle =
              typeof option.displayName === 'function'
                ? option.displayName({ i18n })
                : option.displayName
          }

          return new RegExp(queryString, 'gi').exec(optionTitle) || option.keywords != null
            ? option.keywords.some((keyword) => new RegExp(queryString, 'gi').exec(keyword))
            : false
        })
        if (filteredOptions.length) {
          return {
            ...group,
            options: filteredOptions,
          }
        }
        return null
      })

      groupsWithOptions = groupsWithOptions.filter((group) => group != null)

      // Now add dynamic groups
      const dynamicOptionGroups = getDynamicOptions()

      // merge dynamic options into groups
      for (const dynamicGroup of dynamicOptionGroups) {
        // 1. find the group with the same name or create new one
        let group = groupsWithOptions.find((group) => group.key === dynamicGroup.key)
        if (!group) {
          group = {
            ...dynamicGroup,
            options: [],
          }
        } else {
          groupsWithOptions = groupsWithOptions.filter((group) => group.key !== dynamicGroup.key)
        }

        // 2. Add options to group options array and add to sanitized.slashMenu.groupsWithOptions
        if (group?.options?.length) {
          group.options = group.options.concat(group.options)
        }
        groupsWithOptions.push(group)
      }
    }

    return groupsWithOptions
  }, [getDynamicOptions, queryString, editorConfig?.features, i18n])

  const onSelectOption = useCallback(
    (
      selectedOption: SlashMenuOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      matchingString: string,
    ) => {
      editor.update(() => {
        if (nodeToRemove) {
          nodeToRemove.remove()
        }
        selectedOption.onSelect({ editor, queryString: matchingString })
        closeMenu()
      })
    },
    [editor],
  )

  return (
    <React.Fragment>
      <LexicalTypeaheadMenuPlugin
        anchorElem={anchorElem}
        groupsWithOptions={groups}
        menuRenderFn={(
          anchorElementRef,
          { selectOptionAndCleanUp, selectedOptionKey, setSelectedOptionKey },
        ) =>
          anchorElementRef.current && groups.length
            ? ReactDOM.createPortal(
                <div className={baseClass}>
                  {groups.map((group) => {
                    let groupTitle = group.key
                    if (group.displayName) {
                      groupTitle =
                        typeof group.displayName === 'function'
                          ? group.displayName({ i18n })
                          : group.displayName
                    }

                    return (
                      <div
                        className={`${baseClass}__group ${baseClass}__group-${group.key}`}
                        key={group.key}
                      >
                        <div className={`${baseClass}__group-title`}>{groupTitle}</div>
                        {group.options.map((option, oi: number) => (
                          <SlashMenuItem
                            index={oi}
                            isSelected={selectedOptionKey === option.key}
                            key={option.key}
                            onClick={() => {
                              setSelectedOptionKey(option.key)
                              selectOptionAndCleanUp(option)
                            }}
                            onMouseEnter={() => {
                              setSelectedOptionKey(option.key)
                            }}
                            option={option}
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
        onSelectOption={onSelectOption}
        triggerFn={checkForTriggerMatch}
      />
    </React.Fragment>
  )
}
