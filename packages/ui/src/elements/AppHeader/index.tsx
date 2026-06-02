'use client'
import { formatAdminURL } from 'payload/shared'
import React, { useEffect, useRef, useState } from 'react'

import { Account } from '../../graphics/Account/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { LanguageIcon } from '../../icons/Language/index.js'
import { SidebarIcon } from '../../icons/Sidebar/index.js'
import { useActions } from '../../providers/Actions/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Link } from '../Link/index.js'
import { Localizer } from '../Localizer/index.js'
import { useNav } from '../Nav/context.js'
import { NavToggler } from '../Nav/NavToggler/index.js'
import { RenderCustomComponent } from '../RenderCustomComponent/index.js'
import { StepNav } from '../StepNav/index.js'
import './index.css'

const baseClass = 'app-header'

type Props = {
  CustomAvatar?: React.ReactNode
}
export function AppHeader({ CustomAvatar }: Props) {
  const { t } = useTranslation()
  const locale = useLocale()

  const { Actions } = useActions()

  const { navOpen, setNavOpen } = useNav()

  const {
    config: {
      admin: {
        routes: { account: accountRoute },
      },
      localization,
      routes: { admin: adminRoute },
    },
  } = useConfig()

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
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__wrapper`}>
          <NavToggler className={`${baseClass}__mobile-nav-toggler`} tabIndex={-1} />
          <div className={`${baseClass}__controls-wrapper`}>
            <div className={`${baseClass}__step-nav-wrapper`}>
              <Button
                aria-label={`${navOpen ? t('general:close') : t('general:open')} ${t('general:menu')}`}
                buttonStyle="ghost"
                className={`${baseClass}__sidebar-toggle`}
                icon={<SidebarIcon />}
                onClick={() => setNavOpen(!navOpen)}
                type="button"
              />
              <div className={`${baseClass}__step-nav-wrapper`}>
                <StepNav className={`${baseClass}__step-nav`} />
              </div>
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
              <Localizer
                className={`${baseClass}__localizer`}
                renderButton={({ active, onClick, onKeyDown, ...ariaProps }) => (
                  <Button
                    aria-label={t('general:locale')}
                    buttonStyle="secondary"
                    extraButtonProps={{ onKeyDown, style: { padding: '0 var(--spacer-1) 0 0' } }}
                    icon={<LanguageIcon size={24} />}
                    iconPosition="left"
                    onClick={onClick}
                    selected={active}
                    {...ariaProps}
                  >
                    <div className="localizer__button-content">
                      {locale.code}
                      <ChevronIcon direction={active ? 'up' : 'down'} size={16} />
                    </div>
                  </Button>
                )}
              />
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
    </header>
  )
}
