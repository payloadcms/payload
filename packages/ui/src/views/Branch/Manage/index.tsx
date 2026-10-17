'use client'

import type { DocumentViewClientProps } from 'payload'

import React, { useEffect } from 'react'

import { useStepNav } from '../../../elements/StepNav/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { DefaultEditView } from '../../Edit/index.js'

/**
 * A branch's own fields, at `/manage`.
 *
 * Payload's edit view, unchanged, plus the crumb that says which view you are on.
 * A branch opens to its changed documents, so the branch crumb alone would land
 * you somewhere else than where you are.
 */
export const BranchManageView: React.FC<DocumentViewClientProps> = (props) => (
  <React.Fragment>
    <DefaultEditView {...props} />
    <EditCrumb />
  </React.Fragment>
)

/**
 * Appends to the trail rather than setting it.
 *
 * The edit view owns the trail and rewrites it whenever the document resolves, so
 * a second writer would race it. This reacts to whatever it wrote instead, which
 * self-corrects on every rewrite.
 */
const EditCrumb: React.FC = () => {
  const { setStepNav, stepNav } = useStepNav()
  const { t } = useTranslation()

  const label = t('general:edit')

  useEffect(() => {
    const last = stepNav[stepNav.length - 1]

    // Ours is the only crumb without a link, so this cannot mistake a branch
    // that happens to be named "Edit" for a crumb already appended.
    if (!last || (last.label === label && !last.url)) {
      return
    }

    setStepNav([...stepNav, { label }])
  }, [label, setStepNav, stepNav])

  return null
}
