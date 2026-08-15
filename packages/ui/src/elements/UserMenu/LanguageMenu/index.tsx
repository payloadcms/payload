'use client'
import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { LanguageIcon } from '../../../icons/Language/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Popup, PopupList } from '../../Popup/index.js'
import { useHoverSubmenu } from '../useHoverSubmenu.js'

export const LanguageMenuContent: React.FC = () => {
  const { i18n, languageOptions, switchLanguage } = useTranslation()

  return (
    <div data-popup-prevent-close>
      <PopupList.RadioGroup>
        {languageOptions?.map(({ label, value }) => (
          <PopupList.RadioGroupItem
            active={i18n.language === value}
            key={value}
            onClick={() => {
              if (switchLanguage) {
                void switchLanguage(value)
              }
            }}
          >
            {label}
          </PopupList.RadioGroupItem>
        ))}
      </PopupList.RadioGroup>
    </div>
  )
}

export const LanguageMenu: React.FC<{
  readonly onMobileOpen?: () => void
}> = ({ onMobileOpen }) => {
  const { t } = useTranslation()
  const { close, contentRef, isOpen, keepOpen, open, triggerRef } = useHoverSubmenu('language')

  if (onMobileOpen) {
    return (
      <button
        className="popup-button-list__button popup-button-list__button--submenu-trigger"
        data-popup-prevent-close
        onClick={onMobileOpen}
        type="button"
      >
        <span className="popup-button-list__icon">
          <LanguageIcon size={24} />
        </span>
        <span className="popup-button-list__label">{t('general:language')}</span>
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
            <LanguageIcon size={24} />
          </span>
          <span className="popup-button-list__label">{t('general:language')}</span>
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
        <LanguageMenuContent />
      </div>
    </Popup>
  )
}
