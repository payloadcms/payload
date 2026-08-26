'use client'

import type { Column, SanitizedCollectionConfig } from 'payload'

import React from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Popup } from '../Popup/index.js'
import { ColumnSelectionPopup } from './Popup.js'

export type ColumnSelectionButtonProps = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly columns: Column[]
  /** Called with the next column state whenever a column is toggled or reordered. */
  readonly onChange: (columns: Column[]) => void
}

const baseClass = 'columns-button'

export const ColumnSelectionButton: React.FC<ColumnSelectionButtonProps> = ({
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
        <ColumnSelectionPopup
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
