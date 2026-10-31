import type { PayloadRequest } from 'payload'

import { Forbidden, isolateBranchState, NotFound } from 'payload'
import { MAIN_BRANCH } from 'payload/shared'

import type { BranchChange } from './ChangedDocuments/index.js'

/** The internal registry is not an authority to disclose the documents it references. */
export async function filterReadableBranchChanges({
  branch,
  changes,
  req,
}: {
  branch: string
  changes: BranchChange[]
  req: PayloadRequest
}): Promise<BranchChange[]> {
  const readableChanges: BranchChange[] = []

  for (const change of changes) {
    const entityConfig = change.globalSlug
      ? req.payload.globals.config.find(({ slug }) => slug === change.globalSlug)
      : change.collectionSlug
        ? req.payload.collections[change.collectionSlug]?.config
        : undefined

    if (!entityConfig) {
      continue
    }

    // Tombstones hide the branch document, so a deletion is checked against main.
    const readOptions = {
      branch: change.operation === 'delete' ? MAIN_BRANCH : branch,
      depth: 0,
      disableErrors: true,
      draft: Boolean(entityConfig.versions?.drafts),
      overrideAccess: false,
      req: isolateBranchState(req),
      user: req.user,
    }

    try {
      const doc = change.globalSlug
        ? await req.payload.findGlobal({ ...readOptions, slug: change.globalSlug })
        : await req.payload.findByID({
            ...readOptions,
            id: change.docID!,
            collection: change.collectionSlug!,
          })

      if (doc) {
        readableChanges.push(change)
      }
    } catch (error) {
      if (!(error instanceof Forbidden) && !(error instanceof NotFound)) {
        throw error
      }
    }
  }

  return readableChanges
}
