'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'

import type { Props, TogglerProps } from './types.js'

import { XIcon } from '../../icons/X/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Gutter } from '../Gutter/index.js'
import './index.scss'

const baseClass = 'drawer'

export const drawerZBase = 100

export const formatDrawerSlug = ({ slug, depth }: { depth: number; slug: string }): string =>
  `drawer_${depth}_${slug}`

export { useDrawerSlug } from './useDrawerSlug.js'

export const DrawerToggler: React.FC<TogglerProps> = ({
  slug,
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

  return (
    <button className={className} disabled={disabled} onClick={handleClick} type="button" {...rest}>
      {children}
    </button>
  )
}

export const Drawer: React.FC<Props> = ({
  slug,
  children,
  className,
  gutter = true,
  Header,
  hoverTitle,
  title,
}) => {
  const { t } = useTranslation()
  const { closeModal, modalState } = useModal()
  const drawerDepth = useDrawerDepth()

  const [isOpen, setIsOpen] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    setIsOpen(modalState[slug]?.isOpen)
  }, [slug, modalState])

  useEffect(() => {
    setAnimateIn(isOpen)
  }, [isOpen])

  if (isOpen) {
    // IMPORTANT: do not render the drawer until it is explicitly open, this is to avoid large html trees especially when nesting drawers
    return (
      <DrawerDepthProvider>
        <Modal
          className={[
            className,
            baseClass,
            animateIn && `${baseClass}--is-open`,
            drawerDepth > 1 && `${baseClass}--nested`,
          ]
            .filter(Boolean)
            .join(' ')}
          slug={slug}
          style={{
            zIndex: drawerZBase + drawerDepth,
          }}
        >
          {(!drawerDepth || drawerDepth === 1) && <div className={`${baseClass}__blur-bg`} />}
          <button
            aria-label={t('general:close')}
            className={`${baseClass}__close`}
            id={`close-drawer__${slug}`}
            onClick={() => closeModal(slug)}
            type="button"
          />
          <div
            className={`${baseClass}__content`}
            style={{
              width: `calc(100% - (${drawerDepth} * var(--gutter-h)))`,
            }}
          >
            <div className={`${baseClass}__blur-bg-content`} />
            <Gutter className={`${baseClass}__content-children`} left={gutter} right={gutter}>
              {Header}
              {Header === undefined && (
                <div className={`${baseClass}__header`}>
                  <h2 className={`${baseClass}__header__title`} title={hoverTitle ? title : null}>
                    {title}
                  </h2>
                  {/* TODO: the `button` HTML element breaks CSS transitions on the drawer for some reason...
                    i.e. changing to a `div` element will fix the animation issue but will break accessibility
                  */}
                  <button
                    aria-label={t('general:close')}
                    className={`${baseClass}__header__close`}
                    id={`close-drawer__${slug}`}
                    onClick={() => closeModal(slug)}
                    type="button"
                  >
                    <XIcon />
                  </button>
                </div>
              )}
              {children}
            </Gutter>
          </div>
        </Modal>
      </DrawerDepthProvider>
    )
  }

  return null
}

export const DrawerDepthContext = createContext(1)

export const DrawerDepthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const parentDepth = useDrawerDepth()
  const depth = parentDepth + 1

  return <DrawerDepthContext value={depth}>{children}</DrawerDepthContext>
}

export const useDrawerDepth = (): number => use(DrawerDepthContext)
