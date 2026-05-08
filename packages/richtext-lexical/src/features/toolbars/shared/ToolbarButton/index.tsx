'use client'
import type { LexicalEditor } from 'lexical'

import { Tooltip, useTranslation } from '@payloadcms/ui'
import { $addUpdateTag } from 'lexical'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ToolbarGroupItem } from '../../types.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import './index.css'

const baseClass = 'toolbar-popup__button'

export const ToolbarButton = ({
  active = false,
  children,
  editor,
  enabled = true,
  item,
}: {
  active?: boolean
  children: React.JSX.Element
  editor: LexicalEditor
  enabled?: boolean
  item: ToolbarGroupItem
}) => {
  const { i18n } = useTranslation<{}, string>()
  const {
    fieldProps: { featureClientSchemaMap, schemaPath },
  } = useEditorConfigContext()

  const [showTooltip, setShowTooltip] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Clear pressing state when active prop changes (React has re-rendered)
  useEffect(() => {
    buttonRef.current?.removeAttribute('data-pressing')
  }, [active])

  const tooltipLabel = useMemo(() => {
    if (item.label) {
      return typeof item.label === 'function'
        ? item.label({ featureClientSchemaMap, i18n, schemaPath })
        : item.label
    }
    // Convert camelCase key to Title Case (e.g. "inlineCode" -> "Inline Code")
    return item.key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())
  }, [featureClientSchemaMap, i18n, schemaPath, item])

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
      // We need to wrap the onSelect in the callback, so the editor is properly focused before the onSelect is called.
      item.onSelect?.({
        editor,
        isActive: active,
      })
    })
  }, [editor, item, active, enabled])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // This fixes a bug where you are unable to click the button if you are in a NESTED editor (editor in blocks field in editor).
    // Thus only happens if you click on the SVG of the button. Clicking on the outside works. Related issue: https://github.com/payloadcms/payload/issues/4025
    // TODO: Find out why exactly it happens and why e.preventDefault() on the mouseDown fixes it. Write that down here, or potentially fix a root cause, if there is any.
    e.preventDefault()
    // Suppress hover flash between mouseup and React adding .active class
    ;(e.currentTarget as HTMLElement).setAttribute('data-pressing', '')
  }, [])

  return (
    <button
      aria-label={tooltipLabel}
      className={className}
      data-button-key={item.key}
      disabled={!enabled}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onPointerEnter={() => setShowTooltip(true)}
      onPointerLeave={() => {
        setShowTooltip(false)
        buttonRef.current?.removeAttribute('data-pressing')
      }}
      ref={buttonRef}
      type="button"
    >
      <Tooltip className={`${baseClass}__tooltip`} show={showTooltip}>
        {tooltipLabel}
      </Tooltip>
      {children}
    </button>
  )
}
