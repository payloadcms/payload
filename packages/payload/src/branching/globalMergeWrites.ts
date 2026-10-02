import type { Payload, PayloadRequest } from '../types/index.js'

import { afterRead } from '../fields/hooks/afterRead/index.js'
import { traverseForLocalizedFields } from '../utilities/traverseForLocalizedFields.js'
import { isolateBranchState } from './resolveBranch.js'
import { branchField, MAIN_BRANCH } from './types.js'

export type GlobalMergeWrite = {
  draft: boolean
}

type BaseArgs = {
  branch: string
  globalSlug: string
  payload: Payload
  req: PayloadRequest
}

/** Resolves only the latest source state that should be applied to main. */
export const resolveGlobalMergeWrites = async ({
  branch,
  globalSlug,
  payload,
  req,
}: BaseArgs): Promise<GlobalMergeWrite[]> => {
  const branchGlobal = await payload.db.findGlobal({
    slug: globalSlug,
    branch: false,
    locale: 'all',
    req,
    where: { [branchField]: { equals: branch } },
  })
  const hasPublishedWrite = Boolean(branchGlobal && Object.keys(branchGlobal).length)
  const globalConfig = payload.globals.config.find(({ slug }) => slug === globalSlug)

  if (!globalConfig?.versions) {
    return hasPublishedWrite ? [{ draft: false }] : []
  }

  const { docs } = await payload.db.findGlobalVersions({
    branch: false,
    global: globalSlug,
    limit: 1,
    locale: 'all',
    pagination: false,
    req,
    sort: '-updatedAt',
    where: {
      and: [{ [branchField]: { equals: branch } }, { latest: { equals: true } }],
    },
  })
  const latestVersion = docs[0]?.version as Record<string, unknown> | undefined
  const hasNewerDraft = latestVersion ? statusIncludesDraft(latestVersion._status) : false

  if (hasNewerDraft) {
    return [{ draft: true }]
  }

  return hasPublishedWrite ? [{ draft: false }] : []
}

/** Returns the locales that require distinct writes for one global. */
export const getGlobalMergeLocales = ({
  globalSlug,
  payload,
  req,
}: Omit<BaseArgs, 'branch'>): string[] => {
  const globalConfig = payload.globals.config.find(({ slug }) => slug === globalSlug)
  const localization = payload.config.localization

  if (globalConfig && localization && traverseForLocalizedFields(globalConfig.fields)) {
    return localization.localeCodes
  }

  const defaultLocale = localization && localization.defaultLocale

  return [req.locale && req.locale !== 'all' ? req.locale : defaultLocale || 'en']
}

/** Reads one exact stored branch-global state without hooks, defaults, access, or population. */
export const readBranchGlobalWrite = async ({
  branch,
  draft,
  globalSlug,
  locale,
  payload,
  req,
}: { draft: boolean; locale: string } & BaseArgs): Promise<null | Record<string, unknown>> => {
  const branchReq = isolateBranchState(req)

  branchReq.branch = MAIN_BRANCH
  branchReq.locale = locale
  ;(branchReq.context as Record<string, unknown>)._branchBypass = true

  const globalConfig = payload.globals.config.find(({ slug }) => slug === globalSlug)

  if (!globalConfig) {
    return null
  }

  let storedDocument: null | Record<string, unknown>

  if (draft && globalConfig.versions) {
    const { docs } = await payload.db.findGlobalVersions({
      branch: false,
      global: globalSlug,
      limit: 1,
      locale,
      pagination: false,
      req: branchReq,
      sort: '-updatedAt',
      where: {
        and: [{ [branchField]: { equals: branch } }, { latest: { equals: true } }],
      },
    })

    storedDocument = (docs[0]?.version as Record<string, unknown> | undefined) ?? null
  } else {
    storedDocument = (await payload.db.findGlobal({
      slug: globalSlug,
      branch: false,
      locale,
      req: branchReq,
      where: { [branchField]: { equals: branch } },
    })) as null | Record<string, unknown>
  }

  if (!storedDocument || Object.keys(storedDocument).length === 0) {
    return null
  }

  return afterRead({
    collection: null,
    context: branchReq.context,
    depth: 0,
    doc: storedDocument,
    draft,
    fallbackLocale: null,
    global: globalConfig,
    locale,
    overrideAccess: true,
    req: branchReq,
    showHiddenFields: true,
    triggerAccessControl: false,
    triggerDefaultValue: false,
    triggerHooks: false,
    triggerPopulation: false,
  })
}

const statusIncludesDraft = (status: unknown): boolean =>
  status === 'draft' ||
  (Boolean(status) &&
    typeof status === 'object' &&
    Object.values(status as Record<string, unknown>).includes('draft'))
