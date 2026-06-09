'use client'
import { useWindowInfo } from '@faceless-ui/window-info'
import { formatAdminURL } from 'payload/shared'
import React, { useEffect, useState } from 'react'

import { Account } from '../../graphics/Account/index.js'
import { LogOutIcon } from '../../icons/LogOut/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { MenuSeparator } from '../MenuSeparator/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import { RenderCustomComponent } from '../RenderCustomComponent/index.js'
import { LanguageMenu, LanguageMenuContent } from './LanguageMenu/index.js'
import { SettingsMenu, SettingsMenuContent } from './SettingsMenu/index.js'
import { SubMenuHeader } from './SubMenuHeader/index.js'
import { ThemeMenu, ThemeMenuContent } from './ThemeMenu/index.js'
import './index.css'

const baseClass = 'user-menu'

type UserMenuProps = {
  CustomAvatar?: React.ReactNode
  settingsItems?: React.ReactNode[]
}

export const UserMenu: React.FC<UserMenuProps> = ({ CustomAvatar, settingsItems = [] }) => {
  const { user } = useAuth()
  const { languageOptions, t } = useTranslation()
  const {
    config: {
      admin: {
        routes: { logout: logoutRoute },
        theme: adminTheme,
      },
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  const isMobile = Boolean(smallBreak)

  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<
    'language' | 'settings' | 'theme' | null
  >(null)

  useEffect(() => {
    if (!isMobile) {
      setActiveMobileSubmenu(null)
    }
  }, [isMobile])

  const identifier = user?.username ?? user?.email ?? ''
  const hasMultipleLanguages = Array.isArray(languageOptions) && languageOptions.length > 1
  const showThemeMenu = adminTheme === 'all'
  const hasSettingsItems = settingsItems.length > 0
  const showPreferencesGroup = showThemeMenu || hasMultipleLanguages

  const logoutHref = formatAdminURL({ adminRoute, path: logoutRoute })

  return (
    <Popup
      caret={false}
      className={baseClass}
      horizontalAlign="right"
      onToggleClose={() => setActiveMobileSubmenu(null)}
      renderButton={({ active, ...ariaProps }) => (
        <button
          {...ariaProps}
          aria-label={t('authentication:account')}
          className={[`${baseClass}__trigger`, active && `${baseClass}__trigger--active`]
            .filter(Boolean)
            .join(' ')}
          type="button"
        >
          <RenderCustomComponent CustomComponent={CustomAvatar} Fallback={<Account />} />
        </button>
      )}
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
              <SettingsMenuContent items={settingsItems} />
            </>
          )}
        </>
      ) : (
        // Normal menu content (desktop always; mobile when no active submenu)
        <>
          {/* Profile header */}
          <div className={`${baseClass}__profile`}>
            <div className={`${baseClass}__avatar`}>
              <RenderCustomComponent CustomComponent={CustomAvatar} Fallback={<Account />} />
            </div>
            {user?.name && <p className={`${baseClass}__name`}>{user.name}</p>}
            {identifier && <p className={`${baseClass}__identifier`}>{identifier}</p>}
          </div>

          {/* Preferences group: Theme + Language */}
          {showPreferencesGroup && (
            <PopupList.ButtonGroup>
              {showThemeMenu && (
                <ThemeMenu
                  onMobileOpen={isMobile ? () => setActiveMobileSubmenu('theme') : undefined}
                />
              )}
              {hasMultipleLanguages && (
                <LanguageMenu
                  onMobileOpen={isMobile ? () => setActiveMobileSubmenu('language') : undefined}
                />
              )}
            </PopupList.ButtonGroup>
          )}

          <MenuSeparator />

          {/* Settings group */}
          {hasSettingsItems && (
            <>
              <PopupList.ButtonGroup>
                <SettingsMenu
                  items={settingsItems}
                  onMobileOpen={isMobile ? () => setActiveMobileSubmenu('settings') : undefined}
                />
              </PopupList.ButtonGroup>
              <MenuSeparator />
            </>
          )}

          {/* Account actions */}
          <PopupList.MenuItem>
            <PopupList.Button href={logoutHref} icon={<LogOutIcon />}>
              {t('authentication:logOut')}
            </PopupList.Button>
          </PopupList.MenuItem>
        </>
      )}
    </Popup>
  )
}
