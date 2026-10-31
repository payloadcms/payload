import type { DocumentTabServerProps } from 'payload'

import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { DocumentTabLink } from '../../../../../exports/client/index.js'
import { GearIcon } from '../../../../../icons/Gear/index.js'

const baseClass = 'doc-tab'

/**
 * The branch's own fields — name, description, status — behind an icon.
 *
 * An icon rather than a labelled tab because it is not a peer of the changed
 * documents: those are why the branch exists, this is its metadata. Rendered as a
 * `Component` tab because a tab's `label` is a string, and this needs to be a
 * glyph. `isActive` is left to the link, which derives it from the pathname.
 */
export const BranchSettingsTab: React.FC<{ path?: string } & DocumentTabServerProps> = ({
  path,
  req,
}) => (
  <DocumentTabLink
    adminRoute={req.payload.config.routes.admin}
    ariaLabel={req.i18n.t('branching:branchSettings')}
    baseClass={baseClass}
    href={path ?? '/manage'}
  >
    <span className={`${baseClass}__label`}>
      <GearIcon />
    </span>
  </DocumentTabLink>
)
