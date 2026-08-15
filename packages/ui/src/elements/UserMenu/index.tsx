'use client'
import { useWindowInfo } from '@faceless-ui/window-info'
import { formatAdminURL } from 'payload/shared'
import React, { useEffect, useState } from 'react'

import type { UserMenuSettingsGroup } from './SettingsMenu/index.js'

import { Account } from '../../graphics/Account/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { LogOutIcon } from '../../icons/LogOut/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { MenuSeparator } from '../MenuSeparator/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import { RenderCustomComponent } from '../RenderCustomComponent/index.js'
import { HoverSubmenuGroupProvider } from './HoverSubmenuGroup.js'
import { LanguageMenu, LanguageMenuContent } from './LanguageMenu/index.js'
import { SettingsMenu, SettingsMenuContent } from './SettingsMenu/index.js'
import { SubMenuHeader } from './SubMenuHeader/index.js'
import './index.css'
import { ThemeMenu, ThemeMenuContent } from './ThemeMenu/index.js'

const baseClass = 'user-menu'

type UserMenuProps = {
  CustomAvatar?: React.ReactNode
  CustomLogoutButton?: React.ReactNode
  settingsItemGroups?: UserMenuSettingsGroup[]
  showTitle?: boolean
}

export const UserMenu: React.FC<UserMenuProps> = ({
  CustomAvatar,
  CustomLogoutButton,
  settingsItemGroups = [],
  showTitle = false,
}) => {
  const { user } = useAuth()
  const { languageOptions, t } = useTranslation()
  const {
    config: {
      admin: {
        routes: { account: accountRoute, logout: logoutRoute },
        theme: adminTheme,
        user: userSlug,
      },
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()
  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  const isMobile = Boolean(smallBreak)

  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<
    'language' | 'settings' | 'theme' | null
  >(null)

  // Bumped whenever the account menu closes, so submenu triggers (Theme/Language/Settings)
  // remount and reset their own open/hover state - otherwise a submenu left open via hover
  // stays mounted and open even after the parent menu itself has closed.
  const [menuInstanceKey, setMenuInstanceKey] = useState(0)

  useEffect(() => {
    if (!isMobile) {
      setActiveMobileSubmenu(null)
    }
  }, [isMobile])

  const userCollectionConfig = getEntityConfig({ collectionSlug: userSlug })
  const useAsTitle = userCollectionConfig?.admin?.useAsTitle ?? 'email'
  const titleValue =
    useAsTitle !== 'email' && user ? (user as Record<string, unknown>)[useAsTitle] : undefined
  const titleString = typeof titleValue === 'string' ? titleValue : undefined

  const identifier = user?.username ?? user?.email ?? ''
  const hasMultipleLanguages = Array.isArray(languageOptions) && languageOptions.length > 1
  const showThemeMenu = adminTheme === 'all'
  const hasSettingsItems = settingsItemGroups.some((group) => group.items.length > 0)
  const showPreferencesGroup = showThemeMenu || hasMultipleLanguages

  const logoutHref = formatAdminURL({ adminRoute, path: logoutRoute })
  const accountHref = formatAdminURL({ adminRoute, path: accountRoute })

  return (
    <Popup
      caret={false}
      className={baseClass}
      horizontalAlign="right"
      onToggleClose={() => {
        setActiveMobileSubmenu(null)
        setMenuInstanceKey((key) => key + 1)
      }}
      renderButton={({ active, ...ariaProps }) => (
        <button
          {...ariaProps}
          aria-label={t('authentication:account')}
          className={[
            `${baseClass}__trigger`,
            active && `${baseClass}__trigger--active`,
            showTitle && `${baseClass}__trigger--with-title`,
          ]
            .filter(Boolean)
            .join(' ')}
          type="button"
        >
          <div className={`${baseClass}__trigger-content`}>
            {showTitle && (titleString || identifier) && (
              <p className={`${baseClass}__trigger-label`}>{titleString || identifier}</p>
            )}
            <ChevronIcon direction="down" size={16} />
          </div>
        </button>
      )}
      showScrim
      size="large"
      theme="dark"
      verticalAlign="bottom"
    >
      {isMobile && activeMobileSubmenu ? (
        // Mobile submenu panel
        <>
          {activeMobileSubmenu === 'theme' && (
            <>
              <SubMenuHeader
                onBack={() => setActiveMobileSubmenu(null)}
                title={t('general:theme')}
              />
              <ThemeMenuContent />
            </>
          )}
          {activeMobileSubmenu === 'language' && (
            <>
              <SubMenuHeader
                onBack={() => setActiveMobileSubmenu(null)}
                title={t('general:language')}
              />
              <LanguageMenuContent />
            </>
          )}
          {activeMobileSubmenu === 'settings' && (
            <>
              <SubMenuHeader
                onBack={() => setActiveMobileSubmenu(null)}
                title={t('general:settings')}
              />
              <SettingsMenuContent groups={settingsItemGroups} />
            </>
          )}
        </>
      ) : (
        // Normal menu content (desktop always; mobile when no active submenu)
        <>
          {/* Profile header */}
          <a className={`${baseClass}__profile`} href={accountHref}>
            <div className={`${baseClass}__avatar`}>
              <RenderCustomComponent CustomComponent={CustomAvatar} Fallback={<Account />} />
            </div>
            <div>
              {titleString && <p className={`${baseClass}__name`}>{titleString}</p>}
              {identifier && <p className={`${baseClass}__identifier`}>{identifier}</p>}
            </div>
          </a>

          <HoverSubmenuGroupProvider>
            {/* Preferences group: Theme + Language */}
            {showPreferencesGroup && (
              <>
                {showThemeMenu && (
                  <PopupList.MenuItem>
                    <ThemeMenu
                      key={menuInstanceKey}
                      onMobileOpen={isMobile ? () => setActiveMobileSubmenu('theme') : undefined}
                    />
                  </PopupList.MenuItem>
                )}
                {hasMultipleLanguages && (
                  <PopupList.MenuItem>
                    <LanguageMenu
                      key={menuInstanceKey}
                      onMobileOpen={isMobile ? () => setActiveMobileSubmenu('language') : undefined}
                    />
                  </PopupList.MenuItem>
                )}
              </>
            )}

            <MenuSeparator />

            {/* Settings group */}
            {hasSettingsItems && (
              <>
                <PopupList.MenuItem>
                  <SettingsMenu
                    groups={settingsItemGroups}
                    key={menuInstanceKey}
                    onMobileOpen={isMobile ? () => setActiveMobileSubmenu('settings') : undefined}
                  />
                </PopupList.MenuItem>
                <MenuSeparator />
              </>
            )}
          </HoverSubmenuGroupProvider>

          {/* Account actions */}
          <PopupList.MenuItem>
            {CustomLogoutButton ?? (
              <PopupList.Button href={logoutHref} icon={<LogOutIcon />}>
                {t('authentication:logOut')}
              </PopupList.Button>
            )}
          </PopupList.MenuItem>
        </>
      )}
    </Popup>
  )
}
