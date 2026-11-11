'use client'

import React from 'react'

import type { MergeTarget } from '../../../elements/MergeBranch/context.js'

import { Button } from '../../../elements/Button/index.js'
import { useMergeBranch } from '../../../elements/MergeBranch/context.js'
import { useTranslation } from '../../../providers/Translation/index.js'

/**
 * The primary action on a branch: take what it changed.
 *
 * Raises the shared modal against this screen's target rather than mounting one of
 * its own — the switcher in the app header can raise the same modal from the same
 * page, and two dialogs on one slug stack.
 */
export const MergeChangesButton: React.FC<{
  disabled?: boolean
  target: MergeTarget
}> = ({ disabled, target }) => {
  const { openMerge } = useMergeBranch()
  const { t } = useTranslation()

  return (
    <Button
      buttonStyle="primary"
      disabled={disabled}
      onClick={() => openMerge(target)}
      size="medium"
    >
      {t('branching:mergeChanges')}
    </Button>
  )
}
