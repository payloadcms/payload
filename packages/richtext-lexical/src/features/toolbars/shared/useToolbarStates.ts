'use client'
import type { LexicalEditor } from 'lexical'

import { mergeRegister } from '@lexical/utils'
import { $getSelection } from 'lexical'
import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react'

import type { ToolbarGroup, ToolbarGroupItem } from '../types.js'

import { useEditorConfigContext } from '../../../lexical/config/client/EditorConfigProvider.js'
import { useRunDeprioritized } from '../../../utilities/useRunDeprioritized.js'

export interface ToolbarItemState {
  active: boolean
  enabled: boolean
}

export interface ToolbarGroupState {
  activeItemKeys: string[]
  activeItems: ToolbarGroupItem[]
  enabledGroup: boolean
  enabledItemKeys: string[]
}

export interface ToolbarStates {
  groupStates: Map<string, ToolbarGroupState>
  itemStates: Map<string, ToolbarItemState>
}

/**
 * Build default states where every item is enabled and nothing is active.
 * Used as the initial value so toolbar groups render immediately on mount
 * instead of waiting for the first updateStates call.
 */
function buildDefaultStates(groups: ToolbarGroup[] | undefined): ToolbarStates {
  const itemStates = new Map<string, ToolbarItemState>()
  const groupStates = new Map<string, ToolbarGroupState>()

  if (!groups?.length) {
    return { groupStates, itemStates }
  }

  for (const group of groups) {
    const enabledItemKeys: string[] = []
    for (const item of group.items) {
      itemStates.set(item.key, { active: false, enabled: true })
      enabledItemKeys.push(item.key)
    }
    groupStates.set(group.key, {
      activeItemKeys: [],
      activeItems: [],
      enabledGroup: true,
      enabledItemKeys,
    })
  }

  return { groupStates, itemStates }
}

/**
 * Subscribes once to `editor.registerUpdateListener` and computes
 * isActive / isEnabled for every toolbar item in a read.
 */
export function useToolbarStates(
  editor: LexicalEditor,
  groups: ToolbarGroup[] | undefined,
): ToolbarStates {
  const [states, setStates] = useState<ToolbarStates>(() => buildDefaultStates(groups))
  const deferredStates = useDeferredValue(states)

  const editorConfigContext = useEditorConfigContext()
  const editorConfigContextRef = useRef(editorConfigContext)
  editorConfigContextRef.current = editorConfigContext

  const groupsRef = useRef(groups)
  groupsRef.current = groups

  const runDeprioritized = useRunDeprioritized()

  const updateStates = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!selection) {
        return
      }

      const currentGroups = groupsRef.current
      if (!currentGroups?.length) {
        return
      }

      const ctx = editorConfigContextRef.current
      const newItemStates = new Map<string, ToolbarItemState>()
      const newGroupStates = new Map<string, ToolbarGroupState>()

      for (const group of currentGroups) {
        const activeItemKeys: string[] = []
        const activeItems: ToolbarGroupItem[] = []
        const enabledItemKeys: string[] = []

        const maxActive = group.type === 'dropdown' ? (group.maxActiveItems ?? 1) : undefined

        for (const item of group.items) {
          const isActive = item.isActive
            ? (!maxActive || activeItemKeys.length < maxActive) &&
              item.isActive({ editor, editorConfigContext: ctx, selection })
            : false

          const isEnabled = item.isEnabled
            ? item.isEnabled({ editor, editorConfigContext: ctx, selection })
            : true

          if (isActive) {
            activeItemKeys.push(item.key)
            activeItems.push(item)
          }
          if (isEnabled) {
            enabledItemKeys.push(item.key)
          }

          newItemStates.set(item.key, { active: isActive, enabled: isEnabled })
        }

        const enabledGroup =
          group.type === 'dropdown' && group.isEnabled
            ? group.isEnabled({ editor, editorConfigContext: ctx, selection })
            : true

        newGroupStates.set(group.key, {
          activeItemKeys,
          activeItems,
          enabledGroup,
          enabledItemKeys,
        })
      }

      setStates({ groupStates: newGroupStates, itemStates: newItemStates })
    })
  }, [editor])

  useEffect(() => {
    void runDeprioritized(updateStates)

    const listener = () => runDeprioritized(updateStates)

    const cleanup = mergeRegister(editor.registerUpdateListener(listener))
    document.addEventListener('mouseup', listener)

    return () => {
      cleanup()
      document.removeEventListener('mouseup', listener)
    }
  }, [editor, runDeprioritized, updateStates])

  return deferredStates
}
