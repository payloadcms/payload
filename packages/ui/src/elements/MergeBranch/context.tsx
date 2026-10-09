'use client'

import React, { createContext, use, useCallback, useMemo, useState } from 'react'

import type { SummarizableChange } from '../ChangeSummary/index.js'

import { useModal } from '../Modal/index.js'
import { mergeBranchModalSlug } from './slug.js'

export type MergeTarget = {
  /** `payload-branches` document ID, for the merge endpoint's path. */
  branchID: number | string
  branchName: string
  branchSlug: string
  /**
   * What will be applied, for the modal's summary — the selection where there is one.
   *
   * Passed by openers that have already read the changes, so the modal can say what the
   * merge touches without a second request. The switcher has not, and leaves it out.
   */
  changes?: SummarizableChange[]
  /**
   * Where to go to choose which changes to merge, when the action was raised from
   * somewhere that cannot offer that choice.
   *
   * Set by the branch switcher, which can be opened from any screen; omitted by
   * the changed-documents view, which *is* that page — linking to it from there
   * would send the reader in a circle.
   */
  reviewURL?: string
  /**
   * Change IDs to apply, or undefined to apply everything pending.
   *
   * The changed-documents view owns the selection, and the merge can also be raised
   * from the branch switcher, where there is no selection to make.
   */
  selectedChangeIDs?: (number | string)[]
  /**
   * Changes pending on the branch, when the opener already knows it.
   *
   * The changed-documents view has counted them to render them. The switcher has
   * not, so it leaves this undefined and the modal counts them itself.
   */
  totalChanges?: number
}

type MergeBranchContext = {
  /** Dismisses the modal and forgets what it was pointed at. */
  closeMerge: () => void
  /**
   * Raises the merge modal against a specific target.
   *
   * The target belongs to the *action*, not to the screen: "merge this selection"
   * and "merge the whole branch" are the same modal pointed at different things, and
   * both can be triggered from the same page — the switcher sits in the app header,
   * above every view.
   */
  openMerge: (target: MergeTarget) => void
  /** Null until something raises the modal. */
  target: MergeTarget | null
}

const Context = createContext<MergeBranchContext>({
  closeMerge: () => {},
  openMerge: () => {},
  target: null,
})

/**
 * Holds what the merge modal is currently pointed at.
 *
 * One store, mounted above both the app header and the page, because the modal is
 * mounted exactly once. Rendering it per entry point — the switcher *and* the
 * changed-documents view — stacked two dialogs on the same slug, so opening the
 * merge opened both and only the topmost one showed progress.
 */
export const MergeBranchStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { closeModal, openModal } = useModal()
  const [target, setTarget] = useState<MergeTarget | null>(null)

  const openMerge = useCallback(
    (next: MergeTarget) => {
      setTarget(next)
      openModal(mergeBranchModalSlug)
    },
    [openModal],
  )

  const closeMerge = useCallback(() => {
    closeModal(mergeBranchModalSlug)
    setTarget(null)
  }, [closeModal])

  const value = useMemo<MergeBranchContext>(
    () => ({ closeMerge, openMerge, target }),
    [closeMerge, openMerge, target],
  )

  return <Context value={value}>{children}</Context>
}

export const useMergeBranch = (): MergeBranchContext => use(Context)
