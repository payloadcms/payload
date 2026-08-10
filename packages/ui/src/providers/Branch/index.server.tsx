import type { PayloadRequest } from 'payload'

import { resolveBranch } from 'payload'
import { branchesCollectionSlug, MAIN_BRANCH } from 'payload/shared'
import React from 'react'

import type { BranchOption } from './index.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { BranchProvider } from '../../exports/client/index.js'

/**
 * Loads the branches the user can read and their stored branch preference, then
 * hands both to the client provider.
 *
 * Renders nothing of its own when branching is disabled, so a config without
 * `branching` pays for none of this.
 */
export const RenderBranchProvider = async ({
  children,
  req,
}: {
  children: React.ReactNode
  req?: PayloadRequest
}) => {
  const payload = req?.payload

  if (!payload?.config.branching.enabled || !req.user) {
    return children
  }

  let branches: BranchOption[] = []

  try {
    const { docs } = await payload.find({
      collection: branchesCollectionSlug,
      depth: 0,
      overrideAccess: false,
      pagination: false,
      req,
      select: { name: true, slug: true },
      sort: 'name',
      user: req.user,
      where: { status: { equals: 'open' } },
    })

    branches = docs.reduce<BranchOption[]>((acc, doc) => {
      const slug = typeof doc.slug === 'string' ? doc.slug : undefined

      // `main` is a sentinel rather than a row, so a branch that claims the slug
      // would render a duplicate entry alongside the one the selector adds.
      if (slug && slug !== MAIN_BRANCH) {
        acc.push({ name: typeof doc.name === 'string' && doc.name ? doc.name : slug, slug })
      }

      return acc
    }, [])
  } catch (_err) {
    // Read access to `payload-branches` can legitimately be denied — a user
    // without it simply has no branches to switch between, which must not take
    // the whole admin panel down with it.
    branches = []
  }

  // Already resolved from the user's preference during request initialization,
  // so this is a read of what every query on this request actually used —
  // not a second source of truth that could disagree with the data on screen.
  const activeBranch = resolveBranch(req)

  // A branch the user can no longer see — merged, closed, deleted, or never
  // theirs — must not be presented as the active one. Otherwise the switcher
  // claims a branch while reads quietly fall through to main, which reads as
  // "my edits vanished" rather than "that branch is gone".
  const isActiveBranchStale =
    activeBranch !== MAIN_BRANCH && !branches.some(({ slug }) => slug === activeBranch)

  return (
    <BranchProvider
      activeBranch={isActiveBranchStale ? MAIN_BRANCH : activeBranch}
      branches={branches}
      staleBranch={isActiveBranchStale ? activeBranch : null}
    >
      {children}
    </BranchProvider>
  )
}
