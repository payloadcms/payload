'use client'

import type { ClientWidgetPopoutControl } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import { Button } from '../../../../../elements/Button/index.js'
import { Popup } from '../../../../../elements/Popup/index.js'
import { ChevronIcon } from '../../../../../icons/Chevron/index.js'
import { useTranslation } from '../../../../../providers/Translation/index.js'
import { WidgetPopoutField } from './Field/index.js'
import './index.css'

export function WidgetPopoutControl({
  control,
  data,
  onChange,
  widgetLabel,
}: {
  control: ClientWidgetPopoutControl
  data: Record<string, unknown>
  onChange: (args: { name: string; value: boolean | null | number | string }) => void
  widgetLabel: string
}) {
  const { i18n } = useTranslation()
  const label = getTranslation(control.label, i18n)

  return (
    <Popup
      disableKeyboardNavigation
      horizontalAlign="center"
      popupAriaLabel={`${widgetLabel}: ${label}`}
      popupType="dialog"
      portalClassName="widget-popout"
      render={() => (
        <div data-popup-prevent-close>
          {control.controls.map((child, index) =>
            child.type === 'group' ? (
              <div
                aria-label={child.label ? getTranslation(child.label, i18n) : undefined}
                className="widget-popout__group"
                key={index}
                role="group"
              >
                {child.label && (
                  <div className="widget-popout__heading">{getTranslation(child.label, i18n)}</div>
                )}
                {child.controls.map((field) => (
                  <WidgetPopoutField
                    control={field}
                    key={field.name}
                    onChange={onChange}
                    value={data[field.name]}
                  />
                ))}
              </div>
            ) : (
              <WidgetPopoutField
                control={child}
                key={child.name}
                onChange={onChange}
                value={data[child.name]}
              />
            ),
          )}
        </div>
      )}
      renderButton={({ active, onClick, onKeyDown, ...ariaProps }) => (
        <Button
          aria-label={`${widgetLabel}: ${label}`}
          buttonStyle="ghost"
          className={`widget-wrapper__select-btn${control.Icon ? ' widget-wrapper__select-btn--with-icon' : ''}`}
          extraButtonProps={{ onKeyDown, ...ariaProps }}
          icon={<ChevronIcon size={16} />}
          margin={false}
          onClick={onClick}
          selected={active}
        >
          <span className="widget-wrapper__select-btn-label">
            {control.Icon ? (
              <span aria-hidden className="widget-wrapper__select-btn-icon">
                {control.Icon}
              </span>
            ) : null}
            {label}
          </span>
        </Button>
      )}
      size="fit-content"
      verticalAlign="bottom"
      verticalOffset={12}
    />
  )
}
