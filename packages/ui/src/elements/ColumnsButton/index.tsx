'use client'

import type { Column, SanitizedCollectionConfig } from 'payload'

import React from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { ColumnSelector } from '../ColumnSelector/index.js'
import { Popup } from '../Popup/index.js'

export type ColumnsButtonProps = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly columns: Column[]
  /** Called with the next column state whenever a column is toggled or reordered. */
  readonly onChange: (columns: Column[]) => void
}

const baseClass = 'columns-button'

export const ColumnsButton: React.FC<ColumnsButtonProps> = ({
  collectionSlug,
  columns,
  onChange,
}) => {
  const { t } = useTranslation()

  return (
    <Popup
      className={baseClass}
      horizontalAlign="right"
      render={({ close }) => (
        <ColumnSelector
          collectionSlug={collectionSlug}
          columns={columns}
          onChange={onChange}
          onClose={close}
        />
      )}
      renderButton={({ active, ...props }) => (
        <Button
          {...props}
          buttonStyle="secondary"
          className={`${baseClass}__button`}
          icon={<ChevronIcon direction={active ? 'up' : 'down'} size={16} />}
          selected={active}
          size="medium"
        >
          {t('general:columns')}
        </Button>
      )}
      theme="auto"
      verticalAlign="bottom"
    />
  )
}
