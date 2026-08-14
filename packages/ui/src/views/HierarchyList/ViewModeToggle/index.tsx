'use client'

import React from 'react'

import { Button } from '../../../elements/Button/index.js'
import { AlignJustifiedIcon } from '../../../icons/AlignJustified/index.js'
import { GridViewIcon } from '../../../icons/GridView/index.js'
import './index.css'

const baseClass = 'hierarchy-view-mode-toggle'

export type HierarchyViewMode = 'grid' | 'table'

export type ViewModeToggleProps = {
  onChange: (viewMode: HierarchyViewMode) => void
  viewMode: HierarchyViewMode
}

/**
 * Icon-only segmented control that switches the hierarchy list between its table and card grid
 * renderings. Rendered as two `aria-pressed` toggle buttons rather than a tablist, since both
 * modes describe the same list rather than separate tab panels.
 */
export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ onChange, viewMode }) => {
  const isTableActive = viewMode === 'table'

  const handleSelect = (nextViewMode: HierarchyViewMode) => {
    if (nextViewMode !== viewMode) {
      onChange(nextViewMode)
    }
  }

  return (
    <div className={baseClass}>
      <ViewModeOption
        icon={<AlignJustifiedIcon size={16} />}
        id={`${baseClass}__table`}
        isActive={isTableActive}
        label="Table view"
        onSelect={() => handleSelect('table')}
      />
      <ViewModeOption
        icon={<GridViewIcon size={16} />}
        id={`${baseClass}__grid`}
        isActive={!isTableActive}
        label="Grid view"
        onSelect={() => handleSelect('grid')}
      />
    </div>
  )
}

type ViewModeOptionProps = {
  icon: React.ReactNode
  id: string
  isActive: boolean
  label: string
  onSelect: () => void
}

const ViewModeOption: React.FC<ViewModeOptionProps> = ({ id, icon, isActive, label, onSelect }) => (
  <Button
    aria-label={label}
    buttonStyle={isActive ? 'pill' : 'ghost'}
    className={[`${baseClass}__option`, isActive && `${baseClass}__option--active`]
      .filter(Boolean)
      .join(' ')}
    el="button"
    extraButtonProps={{ 'aria-pressed': isActive, title: label }}
    icon={icon}
    id={id}
    margin={false}
    onClick={onSelect}
  />
)
