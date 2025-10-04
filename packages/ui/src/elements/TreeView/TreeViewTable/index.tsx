'use client'

import React from 'react'

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { useTreeView } from '../../../providers/TreeView/index.js'
import { NestedSectionsTable } from '../NestedSectionsTable/index.js'
import './index.scss'

const baseClass = 'tree-view-results-table'

export function TreeViewTable() {
  const {
    checkIfItemIsDisabled,
    documents,
    dragStartX,
    focusedRowIndex,
    isDragging,
    onItemClick,
    onItemKeyPress,
    selectedItemKeys,
  } = useTreeView()
  const { config } = useConfig()
  const { i18n, t } = useTranslation()

  const [columns] = React.useState(() => [
    {
      name: 'name',
      label: t('general:name'),
    },
    {
      name: 'updatedAt',
      label: t('general:updatedAt'),
    },
  ])

  return (
    <NestedSectionsTable
      className={baseClass}
      dragStartX={dragStartX}
      isDragging={isDragging}
      // sections={documents}
      // columns={columns}
    />
  )
}
