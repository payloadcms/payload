'use client'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { Account } from '../../graphics/Account/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { MenuSeparator } from '../MenuSeparator/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import { RenderCustomComponent } from '../RenderCustomComponent/index.js'
import { LanguageMenu } from './LanguageMenu/index.js'
import { SettingsMenu } from './SettingsMenu/index.js'
import { ThemeMenu } from './ThemeMenu/index.js'
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
      size="fit-content"
      theme="dark"
      verticalAlign="bottom"
    >
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
          {showThemeMenu && <ThemeMenu />}
          {hasMultipleLanguages && <LanguageMenu />}
        </PopupList.ButtonGroup>
      )}

      <MenuSeparator />

      {/* Settings group */}
      {hasSettingsItems && (
        <>
          <PopupList.ButtonGroup>
            <SettingsMenu items={settingsItems} />
          </PopupList.ButtonGroup>
          <MenuSeparator />
        </>
      )}

      {/* Account actions */}
      <PopupList.ButtonGroup>
        <PopupList.Button href={logoutHref}>{t('authentication:logOut')}</PopupList.Button>
      </PopupList.ButtonGroup>
    </Popup>
  )
}
