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
  // Which branches have a merge queued, so the switcher can say so. One small query
  // rather than one per branch — the switcher renders on every admin page.
  let scheduledSlugs = new Set<string>()

  try {
    const { docs } = await payload.find({
      collection: branchesCollectionSlug,
      depth: 0,
      overrideAccess: false,
      pagination: false,
      req,
      // `id` so the switcher can link to the branch itself, not just switch to it;
      // `status` so a merged-but-open branch can be labelled as one.
      select: { id: true, name: true, slug: true, status: true },
      sort: 'name',
      user: req.user,
      // Everything except `closed`. A `merged` branch is still a workspace — §16
      // makes merging an event rather than an ending, and the branch returns to
      // `open` the moment it has a change again. Filtering it out here was what
      // made "keep the branch open" a dead end: the branch survived, but there was
      // no way back onto it to use it.
      where: { status: { not_equals: 'closed' } },
    })

    branches = docs.reduce<BranchOption[]>((acc, doc) => {
      const slug = typeof doc.slug === 'string' ? doc.slug : undefined

      // `main` is a sentinel rather than a row, so a branch that claims the slug
      // would render a duplicate entry alongside the one the selector adds.
      if (slug && slug !== MAIN_BRANCH) {
        acc.push({
          id: doc.id,
          name: typeof doc.name === 'string' && doc.name ? doc.name : slug,
          slug,
          isMerged: doc.status === 'merged',
        })
      }

      return acc
    }, [])

    if (branches.length) {
      const { docs: scheduled } = await payload.find({
        collection: 'payload-jobs',
        depth: 0,
        limit: 100,
        overrideAccess: true,
        pagination: false,
        req,
        select: { input: true },
        where: {
          and: [
            { taskSlug: { equals: 'scheduleMerge' } },
            { waitUntil: { greater_than: new Date() } },
          ],
        },
      })

      scheduledSlugs = new Set(
        scheduled
          .map((job) => (job as { input?: { branch?: string } }).input?.branch)
          .filter((value): value is string => Boolean(value)),
      )

      branches = branches.map((option) => ({
        ...option,
        isScheduled: scheduledSlugs.has(option.slug),
      }))
    }
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
