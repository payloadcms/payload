'use client'

import React from 'react'

import { GridViewIcon } from '../../icons/GridView/index.js'
import { SitemapIcon } from '../../icons/Sitemap/index.js'
import { TableIcon } from '../../icons/Table/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { SegmentedControl } from '../SegmentedControl/index.js'

export type DocumentLayout = 'grid' | 'table' | 'tree'
export type LayoutToggleProps = {
  hasTreeLayout?: boolean
  layout: DocumentLayout
  onChange: (layout: DocumentLayout) => void
}

export const LayoutToggle: React.FC<LayoutToggleProps> = ({ hasTreeLayout, layout, onChange }) => {
  const { t } = useTranslation()

  return (
    <SegmentedControl.Root
      legend={t('general:layout')}
      onChange={(value) => onChange(value as DocumentLayout)}
      value={layout}
    >
      <SegmentedControl.Option
        aria-label={t('general:tableLayout')}
        icon={<TableIcon size={24} />}
        value="table"
      />
      <SegmentedControl.Option
        aria-label={t('general:gridLayout')}
        icon={<GridViewIcon size={24} />}
        value="grid"
      />
      {hasTreeLayout && (
        <SegmentedControl.Option
          aria-label={t('general:treeLayout')}
          icon={<SitemapIcon size={16} />}
          value="tree"
        />
      )}
    </SegmentedControl.Root>
  )
}
