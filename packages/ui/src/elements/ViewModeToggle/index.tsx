'use client'

import React from 'react'

import { GridViewIcon } from '../../icons/GridView/index.js'
import { TableIcon } from '../../icons/Table/index.js'
import { SegmentedControl } from '../SegmentedControl/index.js'

export type DocumentViewMode = 'grid' | 'table'

export type ViewModeToggleProps = {
  onChange: (viewMode: DocumentViewMode) => void
  viewMode: DocumentViewMode
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ onChange, viewMode }) => (
  <SegmentedControl.Root
    legend="View mode"
    onChange={(nextViewMode) => onChange(nextViewMode as DocumentViewMode)}
    value={viewMode}
  >
    <SegmentedControl.Option aria-label="Table view" icon={<TableIcon size={24} />} value="table" />
    <SegmentedControl.Option
      aria-label="Grid view"
      icon={<GridViewIcon size={24} />}
      value="grid"
    />
  </SegmentedControl.Root>
)
