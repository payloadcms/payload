'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'

import type { Props, TogglerProps } from './types.js'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.css'

const baseClass = 'drawer'

export const drawerZBase = 100

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
  const uid = useId()
  const { openDrawerDepths, registerDrawer, unregisterDrawer } = useDrawerStack()

  const isOpen = !!modalState[slug]?.isOpen

  useEffect(() => {
    if (isOpen) {
      registerDrawer(uid, drawerDepth)

      return () => unregisterDrawer(uid)
    }
  }, [isOpen, uid, drawerDepth, registerDrawer, unregisterDrawer])

  const layersFromTop = openDrawerDepths.filter((depth) => depth > drawerDepth).length

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
        // Prevents body-scroll-lock from blocking iOS touch scroll inside the drawer; background scroll is handled by CSS (`body:has(.drawer--is-open)`).
        lockBodyScroll={false}
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

type DrawerStackContextType = {
  /** Depths of every currently-open drawer, used to compute layer offsets. */
  openDrawerDepths: number[]
  registerDrawer: (uid: string, depth: number) => void
  unregisterDrawer: (uid: string) => void
}

const DrawerStackContext = createContext<DrawerStackContextType>({
  openDrawerDepths: [],
  registerDrawer: () => {},
  unregisterDrawer: () => {},
})

/**
 * Tracks the depths of all currently-open drawers so each drawer can compute
 * its leftward offset relative to the rest of the open stack.
 *
 * Why this is needed: drawers are anchored to the right edge and stack as real
 * layers. When a child drawer opens on top of its parent(s), every drawer
 * beneath it must slide left to peek out from underneath the active (topmost)
 * drawer — and slide back when that child closes. A drawer's own depth is
 * static, so it cannot know on its own whether something deeper is currently
 * open; that requires shared runtime state about the whole open stack.
 *
 * We track real `Drawer` instances (rather than scanning modal state by slug
 * name) so confirmation modals like `leave-without-saving-...` never count, and
 * so stacking never depends on slug naming conventions.
 */
export const DrawerStackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [openDrawers, setOpenDrawers] = useState<Record<string, number>>({})

  const registerDrawer = useCallback((uid: string, depth: number) => {
    setOpenDrawers((prev) => (prev[uid] === depth ? prev : { ...prev, [uid]: depth }))
  }, [])

  const unregisterDrawer = useCallback((uid: string) => {
    setOpenDrawers((prev) => {
      if (!(uid in prev)) {
        return prev
      }

      const next = { ...prev }
      delete next[uid]
      return next
    })
  }, [])

  const value = useMemo<DrawerStackContextType>(
    () => ({
      openDrawerDepths: Object.values(openDrawers),
      registerDrawer,
      unregisterDrawer,
    }),
    [openDrawers, registerDrawer, unregisterDrawer],
  )

  return <DrawerStackContext value={value}>{children}</DrawerStackContext>
}

export const useDrawerStack = (): DrawerStackContextType => use(DrawerStackContext)
