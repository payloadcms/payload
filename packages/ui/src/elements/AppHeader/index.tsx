'use client'
import { formatAdminURL } from 'payload/shared'
import React, { useEffect, useRef, useState } from 'react'

import { Account } from '../../graphics/Account/index.js'
import { useActions } from '../../providers/Actions/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Hamburger } from '../Hamburger/index.js'
import { Link } from '../Link/index.js'
import { Localizer } from '../Localizer/index.js'
import { LocalizerLabel } from '../Localizer/LocalizerLabel/index.js'
import { useNav } from '../Nav/context.js'
import { NavToggler } from '../Nav/NavToggler/index.js'
import { RenderCustomComponent } from '../RenderCustomComponent/index.js'
import { StepNav } from '../StepNav/index.js'
import './index.scss'

const baseClass = 'app-header'

type Props = {
  CustomAvatar?: React.ReactNode
  CustomIcon?: React.ReactNode
}
export function AppHeader({ CustomAvatar, CustomIcon }: Props) {
  const { t } = useTranslation()

  const { Actions } = useActions()

  const {
    config: {
      admin: {
        routes: { account: accountRoute },
      },
      localization,
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { navOpen } = useNav()

  const customControlsRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)

  useEffect(() => {
    const checkIsScrollable = () => {
      const el = customControlsRef.current
      if (el) {
        const scrollable = el.scrollWidth > el.clientWidth
        setIsScrollable(scrollable)
      }
    }

    checkIsScrollable()
    window.addEventListener('resize', checkIsScrollable)

    return () => {
      window.removeEventListener('resize', checkIsScrollable)
    }
  }, [Actions])

  const ActionComponents = Actions ? Object.values(Actions) : []

  return (
    <header className={[baseClass, navOpen && `${baseClass}--nav-open`].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__bg`} />
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__wrapper`}>
          <NavToggler className={`${baseClass}__mobile-nav-toggler`} tabIndex={-1}>
            <Hamburger />
          </NavToggler>
          <div className={`${baseClass}__controls-wrapper`}>
            <div className={`${baseClass}__step-nav-wrapper`}>
              <StepNav className={`${baseClass}__step-nav`} CustomIcon={CustomIcon} />
            </div>
            <div className={`${baseClass}__actions-wrapper`}>
              <div className={`${baseClass}__actions`} ref={customControlsRef}>
                {ActionComponents.map((Action, i) => (
                  <div
                    className={
                      isScrollable && i === ActionComponents.length - 1
                        ? `${baseClass}__last-action`
                        : ''
                    }
                    key={i}
                  >
                    {Action}
                  </div>
                ))}
              </div>
              {isScrollable && <div className={`${baseClass}__gradient-placeholder`} />}
            </div>
            {localization && (
              <LocalizerLabel ariaLabel="invisible" className={`${baseClass}__localizer-spacing`} />
            )}
            <Link
              aria-label={t('authentication:account')}
              className={`${baseClass}__account`}
              href={formatAdminURL({ adminRoute, path: accountRoute })}
              prefetch={false}
              tabIndex={0}
            >
              <RenderCustomComponent CustomComponent={CustomAvatar} Fallback={<Account />} />
            </Link>
          </div>
        </div>
      </div>
      <Localizer className={`${baseClass}__localizer`} />
    </header>
  )
}
