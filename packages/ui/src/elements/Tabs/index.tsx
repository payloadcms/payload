'use client'

import React from 'react'

import './index.css'

const baseClass = 'tabs'

export type TabsTab<TValue extends string = string> = {
  disabled?: boolean
  hidden?: boolean
  label: React.ReactNode
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
          isActive={tab.value === value}
          key={tab.value}
          onClick={() => onChange(tab.value)}
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
          role="tablist"
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
  isActive?: boolean
  modifierClassName?: string
  onClick: () => void
}> = ({
  children,
  className,
  disabled,
  hasError,
  hidden,
  isActive,
  modifierClassName,
  onClick,
}) => {
  return (
    <button
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
      onClick={onClick}
      role="tab"
      type="button"
    >
      {children}
    </button>
  )
}
