'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useState } from 'react'

import type { Props, TogglerProps } from './types'

import { Gutter } from '../Gutter'
import { EditDepthContext, useEditDepth } from '../../providers/EditDepth'
import { X } from '../../icons/X'
import { useTranslation } from '../..'

import './index.scss'

const baseClass = 'drawer'
const zBase = 100

export const formatDrawerSlug = ({ depth, slug }: { depth: number; slug: string }): string =>
  `drawer_${depth}_${slug}`

export const DrawerToggler: React.FC<TogglerProps> = ({
  children,
  className,
  disabled,
  onClick,
  slug,
  ...rest
}) => {
  const { openModal } = useModal()

  const handleClick = useCallback(
    (e) => {
      openModal(slug)
      if (typeof onClick === 'function') onClick(e)
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
  children,
  className,
  gutter = true,
  Header,
  hoverTitle,
  slug,
  title,
}) => {
  const { t } = useTranslation()
  const { closeModal, modalState } = useModal()
  const drawerDepth = useEditDepth()
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
          zIndex: zBase + drawerDepth,
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
        <div className={`${baseClass}__content`}>
          <div className={`${baseClass}__blur-bg-content`} />
          <Gutter className={`${baseClass}__content-children`} left={gutter} right={gutter}>
            <EditDepthContext.Provider value={drawerDepth + 1}>
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
                    <X />
                  </button>
                </div>
              )}
              {children}
            </EditDepthContext.Provider>
          </Gutter>
        </div>
      </Modal>
    )
  }

  return null
}
