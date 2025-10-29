'use client'

import React from 'react'

import { useTreeView } from '../../../providers/TreeView/index.js'
import { NestedSectionsTable } from '../NestedSectionsTable/index.js'
import { SeedDataButton } from '../SeedDataButton/index.js'
import './index.scss'

const baseClass = 'tree-view-results-table'
const dropContextName = 'tree-view-table'

export function TreeViewTable() {
  const {
    clearSelections,
    collectionSlug,
    isRowFocusable,
    loadingRowItemKeys,
    onDrop,
    onItemSelection,
    openItemKeys,
    sections,
    selectAll,
    selectedItemKeys,
    toggleRow,
    updateSelections,
  } = useTreeView()

  return (
    <>
      {/* TODO: remove this button */}
      <SeedDataButton collectionSlug={collectionSlug} />
      <NestedSectionsTable
        className={baseClass}
        dropContextName={dropContextName}
        isRowFocusable={isRowFocusable}
        loadingRowItemKeys={loadingRowItemKeys}
        onDrop={onDrop}
        // onEnter={handleEnter}
        onEscape={clearSelections}
        onItemSelection={onItemSelection}
        onSelectAll={selectAll}
        openItemKeys={openItemKeys}
        sections={sections}
        selectedItemKeys={selectedItemKeys}
        toggleRowExpand={toggleRow}
        updateSelections={updateSelections}
      />
    </>
  )
}
