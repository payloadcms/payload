'use client'
import React, { useEffect, useRef, useState } from 'react'

import type { UserMenuSettingsGroup } from '../UserMenu/SettingsMenu/index.js'

import { useElementHeightVariable } from '../../hooks/useElementHeightVariable.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { LanguageIcon } from '../../icons/Language/index.js'
import { SidebarIcon } from '../../icons/Sidebar/index.js'
import { useActions } from '../../providers/Actions/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Localizer } from '../Localizer/index.js'
import { useNav } from '../Nav/context.js'
import { NavToggler } from '../Nav/NavToggler/index.js'
import { StepNav } from '../StepNav/index.js'
import { UserMenu } from '../UserMenu/index.js'
import './index.css'

const baseClass = 'app-header'

type Props = {
  CustomAvatar?: React.ReactNode
  CustomLogoutButton?: React.ReactNode
  settingsItemGroups?: UserMenuSettingsGroup[]
}
export function AppHeader({ CustomAvatar, CustomLogoutButton, settingsItemGroups }: Props) {
  const { t } = useTranslation()
  const locale = useLocale()

  const { Actions } = useActions()

  const { navOpen, setNavOpen } = useNav()

  const {
    config: { localization },
  } = useConfig()

  const headerRef = useRef<HTMLElement>(null)
  const customControlsRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)

  useElementHeightVariable({ cssVar: '--app-header-height', ref: headerRef })

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
    <header
      className={[baseClass, navOpen && `${baseClass}--nav-open`].filter(Boolean).join(' ')}
      ref={headerRef}
    >
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
            <UserMenu
              CustomAvatar={CustomAvatar}
              CustomLogoutButton={CustomLogoutButton}
              settingsItemGroups={settingsItemGroups}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
