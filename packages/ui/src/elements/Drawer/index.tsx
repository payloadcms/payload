'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, { createContext, use, useCallback, useLayoutEffect, useState } from 'react'

import type { Props, TogglerProps } from './types.js'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.css'

const baseClass = 'drawer'

export const drawerZBase = 100

// Slug prefixes for every real drawer variant (base, document, list). Used to
// count stacked drawers without matching confirmation modals like
// `leave-without-saving-...`.
const drawerSlugPrefixes = ['drawer_', 'doc-drawer_', 'list-drawer_']

export const formatDrawerSlug = ({ slug, depth }: { depth: number; slug: string }): string =>
  `drawer_${depth}_${slug}`

export { useDrawerSlug } from './useDrawerSlug.js'

export const DrawerToggler: React.FC<TogglerProps> = ({
  slug,
  buttonStyle,
  children,
  className,
  disabled,
  onClick,
  ...rest
}) => {
  const { openModal } = useModal()

  const handleClick = useCallback(
    (e) => {
      openModal(slug)
      if (typeof onClick === 'function') {
        onClick(e)
      }
    },
    [openModal, slug, onClick],
  )

  if (buttonStyle) {
    return (
      <Button
        buttonStyle={buttonStyle}
        className={className}
        disabled={disabled}
        onClick={handleClick}
        {...rest}
      >
        {children}
      </Button>
    )
  }

  return (
    <button className={className} disabled={disabled} onClick={handleClick} type="button" {...rest}>
      {children}
    </button>
  )
}

export const Drawer: React.FC<Props> = (props) => (
  <DrawerDepthProvider>
    <DrawerInner {...props} />
  </DrawerDepthProvider>
)

const DrawerInner: React.FC<Props> = ({
  slug,
  children,
  className,
  Header,
  headerActions,
  hoverTitle,
  title,
}) => {
  const { t } = useTranslation()
  const { closeModal, modalState } = useModal()
  const drawerDepth = useDrawerDepth()

  const isOpen = !!modalState[slug]?.isOpen

  // Nested drawers stack as real layers: each ancestor stays visible and is
  // pushed 16px left per drawer on top of it. Every drawer paints its own
  // backdrop scrim, so deeper layers stack more scrims and appear darker.
  const openDrawerCount = Object.entries(modalState).filter(
    ([modalSlug, state]) =>
      state?.isOpen && drawerSlugPrefixes.some((p) => modalSlug.startsWith(p)),
  ).length
  const layersFromTop = Math.max(openDrawerCount - drawerDepth, 0)

  const [animateIn, setAnimateIn] = useState(isOpen)

  useLayoutEffect(() => {
    setAnimateIn(isOpen)
  }, [isOpen])

  if (isOpen) {
    // IMPORTANT: do not render the drawer until it is explicitly open, this is to avoid large html trees especially when nesting drawers
    return (
      <Modal
        className={[className, baseClass, animateIn && `${baseClass}--is-open`]
          .filter(Boolean)
          .join(' ')}
        // Fixes https://github.com/payloadcms/payload/issues/13778
        closeOnBlur={false}
        slug={slug}
        style={
          {
            '--drawer-layer-offset': `calc(${layersFromTop} * var(--spacer-3))`,
            zIndex: drawerZBase + drawerDepth,
          } as React.CSSProperties
        }
      >
        <div className={`${baseClass}__blur-bg`} />
        <button
          aria-label={t('general:close')}
          className={`${baseClass}__close`}
          id={`close-drawer__${slug}`}
          onClick={() => closeModal(slug)}
          type="button"
        />
        <div className={`${baseClass}__content`}>
          <div className={`${baseClass}__blur-bg-content`} />
          <div className={`${baseClass}__content-children`}>
            {Header}
            {Header === undefined && (
              <div className={`${baseClass}__header`}>
                {/* TODO: the `button` HTML element breaks CSS transitions on the drawer for some reason...
                  i.e. changing to a `div` element will fix the animation issue but will break accessibility
                */}
                <Button
                  aria-label={t('general:close')}
                  buttonStyle="ghost"
                  className={`${baseClass}__header__close`}
                  icon={<ChevronIcon direction="left" size={24} />}
                  onClick={() => closeModal(slug)}
                />
                <h2 className={`${baseClass}__header__title`} title={hoverTitle ? title : null}>
                  {title}
                </h2>
                {headerActions && headerActions.length > 0 && (
                  <div className={`${baseClass}__header__actions`}>
                    {headerActions.map((action, i) => (
                      <Button
                        buttonStyle={action.style || 'secondary'}
                        disabled={action.disabled}
                        key={i}
                        margin={false}
                        onClick={action.onClick}
                        size="medium"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </Modal>
    )
  }

  return null
}

export const DrawerDepthContext = createContext(0)

export const DrawerDepthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const parentDepth = useDrawerDepth()
  const depth = parentDepth + 1

  return <DrawerDepthContext value={depth}>{children}</DrawerDepthContext>
}

export const useDrawerDepth = (): number => use(DrawerDepthContext)
