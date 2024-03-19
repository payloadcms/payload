'use client'
import LinkWithDefault from 'next/link.js'
import React, { useEffect, useRef, useState } from 'react'

import Account from '../../graphics/Account/index.jsx'
import { useActions } from '../../providers/ActionsProvider/index.jsx'
import { useConfig } from '../../providers/Config/index.jsx'
import { useTranslation } from '../../providers/Translation/index.jsx'
import { Hamburger } from '../Hamburger/index.jsx'
import { LocalizerLabel } from '../Localizer/LocalizerLabel/index.jsx'
import { Localizer } from '../Localizer/index.jsx'
import { NavToggler } from '../Nav/NavToggler/index.jsx'
import { useNav } from '../Nav/context.jsx'
import { StepNav } from '../StepNav/index.jsx'
import './index.scss'

const baseClass = 'app-header'

export const AppHeader: React.FC = () => {
  const { t } = useTranslation()

  const {
    localization,
    routes: { admin: adminRoute },
  } = useConfig()

  const { actions } = useActions()

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
  }, [actions])

  const Link = LinkWithDefault.default

  const LinkElement = Link || 'a'

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
              <StepNav Link={Link} className={`${baseClass}__step-nav`} />
            </div>
            <div className={`${baseClass}__actions-wrapper`}>
              <div className={`${baseClass}__actions`} ref={customControlsRef}>
                {Array.isArray(actions) &&
                  actions.map((Action, i) => (
                    <div
                      className={
                        isScrollable && i === actions.length - 1 ? `${baseClass}__last-action` : ''
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
            <LinkElement
              aria-label={t('authentication:account')}
              className={`${baseClass}__account`}
              href={`${adminRoute}/account`}
              tabIndex={0}
            >
              <Account />
            </LinkElement>
          </div>
        </div>
      </div>
      <Localizer className={`${baseClass}__localizer`} />
    </header>
  )
}
