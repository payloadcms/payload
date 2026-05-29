'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import type { CommandPaletteAction } from './types.js'

import { useHotkey } from '../../hooks/useHotkey.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEntityVisibility } from '../../providers/EntityVisibility/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { buildActions } from './buildActions.js'
import { filterActions } from './filterActions.js'
import './index.css'

export const commandPaletteSlug = 'command-palette'
const baseClass = 'cmd-palette'

const cmdKKeyCodes = ['k']
const optionId = (action: CommandPaletteAction) => `${baseClass}-option-${action.id}`

export const CommandPalette: React.FC = () => {
  const { closeModal, modalState, openModal } = useModal()
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()
  const { visibleEntities } = useEntityVisibility()
  const {
    config: {
      collections,
      globals,
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const isOpen = Boolean(modalState[commandPaletteSlug]?.isOpen)

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const listboxId = useId()

  // Open at edit depth 1 (top level). Re-press while open is handled inside onKeyDown.
  useHotkey({ cmdCtrlKey: true, editDepth: 1, keyCodes: cmdKKeyCodes }, (event) => {
    event.preventDefault()
    openModal(commandPaletteSlug)
  })

  const groups = useMemo(
    () => buildActions({ adminRoute, collections, globals, i18n, permissions, visibleEntities }),
    [adminRoute, collections, globals, i18n, permissions, visibleEntities],
  )

  const filteredGroups = useMemo(() => filterActions(groups, query), [groups, query])

  const flatActions = useMemo(
    () => filteredGroups.flatMap((group) => group.actions),
    [filteredGroups],
  )

  // Reset state whenever the palette opens, and focus the input.
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Keep the active index in range as results change.
  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, flatActions.length - 1)))
  }, [flatActions.length])

  // Scroll active option into view on keyboard navigation.
  useEffect(() => {
    const active = flatActions[activeIndex]
    if (active) {
      document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, flatActions])

  const close = useCallback(() => closeModal(commandPaletteSlug), [closeModal])

  const activeAction = flatActions[activeIndex]

  const runAction = useCallback(
    (action: CommandPaletteAction | undefined, create: boolean) => {
      if (!action) {
        return
      }
      const href = create ? action.createHref : action.href
      if (!href) {
        return
      }
      close()
      router.push(href)
    },
    [close, router],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const isCmdCtrl = event.metaKey || event.ctrlKey

      if (event.key === 'Escape' || (isCmdCtrl && event.key.toLowerCase() === 'k')) {
        event.preventDefault()
        close()
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((current) => Math.min(current + 1, flatActions.length - 1))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((current) => Math.max(current - 1, 0))
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        runAction(activeAction, isCmdCtrl)
      }
    },
    [activeAction, close, flatActions.length, runAction],
  )

  if (!isOpen) {
    return null
  }

  const hasResults = flatActions.length > 0
  const hasCreatableAction = flatActions.some((action) => action.createHref)

  return (
    <Modal className={baseClass} slug={commandPaletteSlug}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- keyboard handling is delegated to the input (combobox pattern) */}
      <div className={`${baseClass}__inner`} onKeyDown={onKeyDown}>
        <input
          aria-activedescendant={activeAction ? optionId(activeAction) : undefined}
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-label={t('commandPalette:title')}
          autoComplete="off"
          className={`${baseClass}__input`}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          placeholder={t('commandPalette:placeholder')}
          ref={inputRef}
          role="combobox"
          spellCheck={false}
          type="text"
          value={query}
        />

        <div
          aria-label={t('commandPalette:title')}
          className={`${baseClass}__results`}
          id={listboxId}
          role="listbox"
        >
          {filteredGroups.map((group) => (
            <div
              aria-label={group.label}
              className={`${baseClass}__group`}
              key={group.label}
              role="group"
            >
              <div aria-hidden="true" className={`${baseClass}__group-label`}>
                {group.label}
              </div>
              {group.actions.map((action) => {
                const flatIndex = flatActions.indexOf(action)
                const isActive = action === activeAction
                return (
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- keyboard events are handled by the combobox input; focus stays in the input per ARIA combobox pattern
                  <div
                    aria-selected={isActive}
                    className={[`${baseClass}__option`, isActive && `${baseClass}__option--active`]
                      .filter(Boolean)
                      .join(' ')}
                    id={optionId(action)}
                    key={action.id}
                    onClick={() => runAction(action, false)}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    role="option"
                  >
                    <span className={`${baseClass}__option-label`}>{action.label}</span>
                    {isActive && action.createHref ? (
                      <button
                        className={`${baseClass}__option-create`}
                        onClick={(event) => {
                          event.stopPropagation()
                          runAction(action, true)
                        }}
                        type="button"
                      >
                        {t('commandPalette:createNew')} ⌘⏎
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ))}

          {!hasResults ? (
            <div aria-live="polite" className={`${baseClass}__empty`} role="status">
              {t('commandPalette:noResults')}
            </div>
          ) : null}
        </div>

        <div className={`${baseClass}__footer`}>
          <span>↑↓ {t('commandPalette:hintNavigate')}</span>
          <span>⏎ {t('commandPalette:hintSelect')}</span>
          {hasCreatableAction ? <span>⌘⏎ {t('commandPalette:hintCreate')}</span> : null}
          <span>esc {t('commandPalette:hintClose')}</span>
        </div>
      </div>
    </Modal>
  )
}
