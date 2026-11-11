'use client'
import { MAIN_BRANCH } from 'payload/shared'
import React from 'react'

import { Pill } from '../../../../elements/Pill/index.js'

/**
 * Which branch a version belongs to.
 *
 * History on a branch is a continuation of main's, so rows from both appear in one
 * list — this is what tells them apart. `main` is styled differently from a branch
 * so production history is distinguishable at a glance.
 */
export function BranchCell({ branch }: { branch?: null | string }) {
  if (!branch) {
    return null
  }

  const isMain = branch === MAIN_BRANCH

  return (
    <Pill pillStyle={isMain ? 'light-gray' : 'light'} size="small">
      {branch}
    </Pill>
  )
}
