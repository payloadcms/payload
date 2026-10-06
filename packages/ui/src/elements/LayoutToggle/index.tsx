'use client'

import React from 'react'

import { GridViewIcon } from '../../icons/GridView/index.js'
import { TableIcon } from '../../icons/Table/index.js'
import { SegmentedControl } from '../SegmentedControl/index.js'

export type DocumentLayout = 'grid' | 'table'
export type LayoutToggleProps = {
  layout: DocumentLayout
  onChange: (layout: DocumentLayout) => void
}

export const LayoutToggle: React.FC<LayoutToggleProps> = ({ layout, onChange }) => (
  <SegmentedControl.Root
    legend="Layout"
    onChange={(value) => onChange(value as DocumentLayout)}
    value={layout}
  >
    <SegmentedControl.Option aria-label="Table" icon={<TableIcon size={24} />} value="table" />
    <SegmentedControl.Option aria-label="Grid" icon={<GridViewIcon size={24} />} value="grid" />
  </SegmentedControl.Root>
)
