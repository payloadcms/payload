'use client'

import React from 'react'

import './index.css'

const baseClass = 'tabs'

export type TabsTab<TValue extends string = string> = {
  disabled?: boolean
  hidden?: boolean
  id?: string
  label: React.ReactNode
  panelID?: string
  value: TValue
}

export type TabsProps<TValue extends string = string> = {
  className?: string
  onChange: (value: TValue) => void
  tabs: TabsTab<TValue>[]
  value: TValue
}

export const Tabs = <TValue extends string = string>({
  className,
  onChange,
  tabs,
  value,
}: TabsProps<TValue>) => {
  return (
    <TabsList className={className}>
      {tabs.map((tab) => (
        <TabButton
          disabled={tab.disabled}
          hidden={tab.hidden}
          id={tab.id}
          isActive={tab.value === value}
          key={tab.value}
          onClick={() => onChange(tab.value)}
          panelID={tab.panelID}
        >
          {tab.label}
        </TabButton>
      ))}
    </TabsList>
  )
}

export const TabsList: React.FC<{
  children: React.ReactNode
  className?: string
  tabsClassName?: string
  tabsWrapClassName?: string
}> = ({ children, className, tabsClassName, tabsWrapClassName }) => {
  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <div className={[`${baseClass}__tabs-wrap`, tabsWrapClassName].filter(Boolean).join(' ')}>
        <div
          className={[`${baseClass}__tabs`, tabsClassName].filter(Boolean).join(' ')}
          onKeyDown={(event) => {
            if (
              event.altKey ||
              event.ctrlKey ||
              event.metaKey ||
              !['ArrowLeft', 'ArrowRight', 'End', 'Home'].includes(event.key)
            ) {
              return
            }

            const tabs = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
            ).filter((tab) => !tab.disabled && tab.getClientRects().length > 0)
            const index = tabs.indexOf(event.target as HTMLButtonElement)

            if (index === -1) {
              return
            }

            event.preventDefault()
            const isRTL = getComputedStyle(event.currentTarget).direction === 'rtl'
            const direction = (event.key === 'ArrowRight' ? 1 : -1) * (isRTL ? -1 : 1)
            const nextIndex =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? tabs.length - 1
                  : (index + direction + tabs.length) % tabs.length

            tabs[nextIndex]?.focus()
          }}
          role="tablist"
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export const TabButton: React.FC<{
  children: React.ReactNode
  className?: string
  disabled?: boolean
  hasError?: boolean
  hidden?: boolean
  id?: string
  isActive?: boolean
  modifierClassName?: string
  onClick: () => void
  panelID?: string
}> = ({
  id,
  children,
  className,
  disabled,
  hasError,
  hidden,
  isActive,
  modifierClassName,
  onClick,
  panelID,
}) => {
  return (
    <button
      aria-controls={panelID}
      aria-selected={isActive}
      className={[
        `${baseClass}__tab-button`,
        className,
        hasError && `${baseClass}__tab-button--has-error`,
        hasError && modifierClassName && `${modifierClassName}--has-error`,
        isActive && `${baseClass}__tab-button--active`,
        isActive && modifierClassName && `${modifierClassName}--active`,
        hidden && `${baseClass}__tab-button--hidden`,
        hidden && modifierClassName && `${modifierClassName}--hidden`,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      id={id}
      onClick={onClick}
      onFocus={(event) => {
        event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      }}
      role="tab"
      tabIndex={isActive && !hidden ? 0 : -1}
      type="button"
    >
      {children}
    </button>
  )
}
