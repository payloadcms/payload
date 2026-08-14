'use client'

import React from 'react'

import { MergeBranchStoreProvider } from './context.js'
import { MergeBranchModal } from './index.js'

/**
 * The merge modal and the store that points it at something, mounted together.
 *
 * Composed here rather than leaving the modal to each entry point: one provider
 * renders exactly one modal, which is the only way to guarantee two dialogs cannot
 * share the slug. Every trigger calls `openMerge` instead of mounting its own.
 */
export const MergeBranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MergeBranchStoreProvider>
    {children}
    <MergeBranchModal />
  </MergeBranchStoreProvider>
)
