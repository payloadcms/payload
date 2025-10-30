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
    loadingItemKeys,
    onDrop,
    onItemSelection,
    openItemKeys,
    rootItems,
    selectAll,
    selectedItemKeys,
    toggleItemExpand,
    updateSelections,
  } = useTreeView()

  return (
    <>
      {/* TODO: remove this button */}
      <SeedDataButton collectionSlug={collectionSlug} />
      <NestedSectionsTable
        className={baseClass}
        dropContextName={dropContextName}
        loadingItemKeys={loadingItemKeys}
        onDrop={onDrop}
        // onEnter={handleEnter}
        onEscape={clearSelections}
        onItemSelection={onItemSelection}
        onSelectAll={selectAll}
        openItemKeys={openItemKeys}
        rootItems={rootItems}
        selectedItemKeys={selectedItemKeys}
        toggleItemExpand={toggleItemExpand}
        updateSelections={updateSelections}
      />
    </>
  )
}
