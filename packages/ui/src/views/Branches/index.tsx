import type { AdminViewServerProps, VisibleEntities } from 'payload'

import { branchesCollectionSlug } from 'payload/shared'
import React from 'react'

import type { RenderListViewArgs } from '../List/index.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { EntityVisibilityProvider } from '../../exports/client/index.js'
import { DocumentView } from '../Document/index.js'
import { ListView } from '../List/index.js'

/**
 * Routes for `payload-branches`.
 *
 * The collection is `admin.hidden`, which is what keeps it out of the nav, the
 * dashboard and the command palette — branches are a scope control, not a content
 * type, and the only way in is the switcher in the app header. But the generic
 * list and document views treat a hidden collection as not-found, so its own
 * routes need to opt back in. That is all these wrappers do; the views themselves
 * are Payload's, unchanged.
 */
export const BranchesListView: React.FC<RenderListViewArgs> = (props) => (
  <EntityVisibilityProvider visibleEntities={withBranchesVisible(props)}>
    <ListView {...props} overrideEntityVisibility />
  </EntityVisibilityProvider>
)

export const BranchDocumentView: React.FC<AdminViewServerProps> = (props) => (
  <EntityVisibilityProvider visibleEntities={withBranchesVisible(props)}>
    <DocumentView {...props} overrideEntityVisibility />
  </EntityVisibilityProvider>
)

/**
 * Hidden from the nav, but reachable here.
 *
 * `overrideEntityVisibility` opts these routes back in on the server; this is the
 * same opt-in for the client, which otherwise treats the collection as somewhere
 * it cannot link to. Without it the breadcrumbs render as inert text rather than
 * links back to the branch and the branch list.
 */
const withBranchesVisible = ({
  initPageResult,
}: {
  initPageResult: { visibleEntities: VisibleEntities }
}): VisibleEntities => {
  const { visibleEntities } = initPageResult

  if (visibleEntities.collections.includes(branchesCollectionSlug)) {
    return visibleEntities
  }

  return {
    ...visibleEntities,
    collections: [...visibleEntities.collections, branchesCollectionSlug],
  }
}
