'use client'
import type { LexicalEditor } from 'lexical'

import { $addUpdateTag } from 'lexical'
import React, { useCallback, useMemo } from 'react'

import type { ToolbarGroupItem } from '../../types.js'

import './index.scss'

const baseClass = 'toolbar-popup__button'

export const ToolbarButton = ({
  active,
  children,
  editor,
  enabled,
  item,
}: {
  active: boolean
  children: React.JSX.Element
  editor: LexicalEditor
  enabled: boolean
  item: ToolbarGroupItem
}) => {
  const className = useMemo(() => {
    return [
      baseClass,
      !enabled ? 'disabled' : '',
      active ? 'active' : '',
      item.key ? `${baseClass}-${item.key}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }, [active, enabled, item.key])

  const handleClick = useCallback(() => {
    if (!enabled) {
      return
    }

    editor.focus(() => {
      editor.update(() => {
        $addUpdateTag('toolbar')
      })
      item.onSelect?.({
        editor,
        isActive: active,
      })
    })
  }, [editor, item, active, enabled])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Fixes inability to click SVG buttons in nested editors. Related: https://github.com/payloadcms/payload/issues/4025
    e.preventDefault()
  }, [])

  return (
    <button
      className={className}
      data-button-key={item.key}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      type="button"
    >
      {children}
    </button>
  )
}
