'use client'
import React, { Fragment } from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { GearIcon } from '../../../icons/Gear/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { MenuSeparator } from '../../MenuSeparator/index.js'
import { Popup, PopupList } from '../../Popup/index.js'
import { useHoverSubmenu } from '../useHoverSubmenu.js'

export type UserMenuSettingsGroup = {
  group?: string
  items: React.ReactNode[]
}

type SettingsMenuProps = {
  groups: UserMenuSettingsGroup[]
  onMobileOpen?: () => void
}

export const SettingsMenuContent: React.FC<{ groups: UserMenuSettingsGroup[] }> = ({ groups }) => (
  <>
    {groups.map((group, groupIndex) => (
      <Fragment key={`settings-group-${group.group}-${groupIndex}`}>
        {groupIndex > 0 && <MenuSeparator />}
        {group.group && <PopupList.GroupLabel label={group.group} />}
        {group.items.map((item, itemIndex) => (
          <Fragment key={`settings-item-${groupIndex}-${itemIndex}`}>{item}</Fragment>
        ))}
      </Fragment>
    ))}
  </>
)

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ groups, onMobileOpen }) => {
  const { t } = useTranslation()
  const { close, contentRef, isOpen, keepOpen, open, triggerRef } = useHoverSubmenu('settings')

  if (onMobileOpen) {
    return (
      <button
        className="popup-button-list__button popup-button-list__button--submenu-trigger"
        data-popup-prevent-close
        onClick={onMobileOpen}
        type="button"
      >
        <span className="popup-button-list__icon">
          <GearIcon size={24} />
        </span>
        <span className="popup-button-list__label">{t('general:settings')}</span>
        <span className="popup-button-list__chevron">
          <ChevronIcon direction="right" size={24} />
        </span>
      </button>
    )
  }

  return (
    <Popup
      forceOpen={isOpen}
      onToggleOpen={(nextOpen) => {
        if (!nextOpen) {
          close()
        }
      }}
      renderButton={({ active, onClick, onKeyDown, ...aria }) => (
        <button
          {...aria}
          className="popup-button-list__button popup-button-list__button--submenu-trigger"
          onClick={onClick}
          onKeyDown={onKeyDown}
          onMouseEnter={open}
          ref={triggerRef as React.Ref<HTMLButtonElement>}
          type="button"
        >
          <span className="popup-button-list__icon">
            <GearIcon size={24} />
          </span>
          <span className="popup-button-list__label">{t('general:settings')}</span>
          <span className="popup-button-list__chevron">
            <ChevronIcon direction="right" size={16} />
          </span>
        </button>
      )}
      side="left"
      size="large"
      theme="dark"
    >
      <div onMouseEnter={keepOpen} ref={contentRef as React.Ref<HTMLDivElement>}>
        <SettingsMenuContent groups={groups} />
      </div>
    </Popup>
  )
}
