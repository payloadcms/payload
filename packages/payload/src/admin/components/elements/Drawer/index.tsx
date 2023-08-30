import { Modal, useModal } from '@faceless-ui/modal'
import pkg from '@faceless-ui/window-info'
const { useWindowInfo } = pkg
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props, TogglerProps } from './types.js'

import X from '../../icons/X/index.js'
import { EditDepthContext, useEditDepth } from '../../utilities/EditDepth/index.js'
import { Gutter } from '../Gutter/index.js'
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
  header,
  slug,
  title,
}) => {
  const { t } = useTranslation('general')
  const { closeModal, modalState } = useModal()
  const {
    breakpoints: { m: midBreak },
  } = useWindowInfo()
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
        className={[className, baseClass, animateIn && `${baseClass}--is-open`]
          .filter(Boolean)
          .join(' ')}
        style={{
          zIndex: zBase + drawerDepth,
        }}
        slug={slug}
      >
        {drawerDepth === 1 && <div className={`${baseClass}__blur-bg`} />}
        <button
          style={{
            width: `calc(${midBreak ? 'var(--gutter-h)' : 'var(--nav-width)'} + ${
              drawerDepth - 1
            } * 25px)`,
          }}
          aria-label={t('close')}
          className={`${baseClass}__close`}
          id={`close-drawer__${slug}`}
          onClick={() => closeModal(slug)}
          type="button"
        />
        <div className={`${baseClass}__content`}>
          <Gutter className={`${baseClass}__content-children`} left={gutter} right={gutter}>
            <EditDepthContext.Provider value={drawerDepth + 1}>
              {header && header}
              {header === undefined && (
                <div className={`${baseClass}__header`}>
                  <h2 className={`${baseClass}__header__title`}>{title}</h2>
                  <button
                    aria-label={t('close')}
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
