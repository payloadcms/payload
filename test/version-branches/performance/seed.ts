/* eslint-disable payload/no-relative-monorepo-imports -- Authoritative large-scale fixture uses real schema transforms, composition and native loading. */
import type { Payload } from 'payload'

import { performance } from 'node:perf_hooks'
import { buildVersionCollectionFields, createPayloadRequest } from 'payload'

import type { BranchQueryPerformanceScenario } from './scenarios.js'

import { compileBranchScopeFields } from '../../../packages/payload/src/versions/branches/compileBranchScopeFields.js'
import { encodeBranchProjectionDocument } from '../../../packages/payload/src/versions/branches/queries/branchProjectionCodec.js'
import {
  initializeBranchProjectionScope,
  registerBranchProjectionScopes,
} from '../../../packages/payload/src/versions/branches/queries/branchProjectionGuard.js'
import { composeBranchProjection } from '../../../packages/payload/src/versions/branches/queries/composeBranchProjection.js'
import {
  getBranchKey,
  getBranchStorageKey,
} from '../../../packages/payload/src/versions/branches/storage/branchStorage.js'
import { createNativeBulkLoader } from './nativeBulkLoader.js'
import {
  buildPerformanceData,
  getPerformanceBranches,
  getPerformanceLogicalID,
  hasPerformanceOverride,
  performanceLocales,
  performanceSlug,
} from './scenarios.js'

export const seedBranchPerformance = async ({
  payload,
  scenario,
}: {
  payload: Payload
  scenario: BranchQueryPerformanceScenario
}) => {
  const source = payload.collections[performanceSlug]!.config
  const storage = source.custom.branchStorage
  const control = source.custom.branchQueryStorage
  const cache = payload.collections[control.projection]!.config
  const loader = createNativeBulkLoader({ payload })
  const seedStarted = performance.now()
  const versionFields = buildVersionCollectionFields(payload.config, source)
  const fields = compileBranchScopeFields({ blocks: payload.config.blocks, fields: source.fields })
  const locales = performanceLocales.slice(0, scenario.locales)
  const branches = getPerformanceBranches({ scenario })
  const scopes = [
    { type: 'shared' as const },
    ...locales.map((locale) => ({ type: 'locale' as const, locale })),
  ]
  const isMongo = payload.db.name === 'mongoose'
  const nativeID = ({ ordinal }: { ordinal: number }) =>
    isMongo ? ordinal.toString(16).padStart(24, '0') : ordinal
  const versionID = ({ ordinal, revision }: { ordinal: number; revision: number }) =>
    nativeID({ ordinal: (ordinal + 1) * 1000 + revision })
  const dataFor = ({ ordinal, hasOverride }: { hasOverride: boolean; ordinal: number }) =>
    buildPerformanceData({ hasOverride, ordinal, scenario })
  const effective = ({ ordinal }: { ordinal: number }) => {
    const main = { id: versionID({ ordinal, revision: 1 }), generation: 1 }
    const hasOverride = hasPerformanceOverride({ ordinal, scenario })
    const override = { id: versionID({ ordinal, revision: 2 }), generation: 1 }
    const mainState = { type: 'version' as const, version: main, structure: null }
    const overrideState = { type: 'version' as const, version: override, structure: null }

    return composeBranchProjection({
      fields,
      isStatusLocalized: true,
      logicalID: getPerformanceLogicalID({ ordinal }),
      scopes: scopes.map((scope) => ({
        scope,
        main: mainState,
        selected:
          hasOverride && scope.type === 'locale' && scope.locale === 'fr'
            ? overrideState
            : mainState,
      })),
      versions: [
        { reference: main, data: dataFor({ ordinal, hasOverride: false }) },
        ...(hasOverride
          ? [{ reference: override, data: dataFor({ ordinal, hasOverride: true }) }]
          : []),
      ],
    }).data
  }
  const add = ({ slug, data }: { data: Record<string, unknown>; slug: string }) =>
    loader.add({ entity: { slug, fields: payload.collections[slug]!.config.fields }, data })
  const each = async ({
    label,
    run,
  }: {
    label: string
    run: (args: { ordinal: number }) => void
  }) => {
    for (let ordinal = 0; ordinal < scenario.documents; ordinal++) {
      run({ ordinal })
      if ((ordinal + 1) % 250 === 0) {
        await loader.flush()
      }
      if ((ordinal + 1) % 10_000 === 0) {
        console.log(
          JSON.stringify({
            event: 'branch-performance-seed',
            phase: label,
            completed: ordinal + 1,
            total: scenario.documents,
            elapsedMilliseconds: performance.now() - seedStarted,
            ...loader.metrics,
            residentSetBytes: process.memoryUsage().rss,
          }),
        )
      }
    }
    await loader.flush()
  }
  const timestamp = '2026-01-01T00:00:00.000Z'
  const versionsEntity = { slug: performanceSlug, fields: versionFields, versions: true }

  // Ordinary anchors retain their logical IDs and published materialization.
  await each({
    label: 'published-content',
    run: ({ ordinal }) =>
      loader.add({
        entity: { slug: performanceSlug, fields: source.fields },
        data: {
          ...dataFor({ ordinal, hasOverride: false }),
          _status: Object.fromEntries(locales.map((locale) => [locale, 'published'])),
        },
      }),
  })
  await each({
    label: 'published-relationships',
    run: ({ ordinal }) =>
      loader.add({
        entity: { slug: performanceSlug, fields: source.fields },
        data: dataFor({ ordinal, hasOverride: false }),
        phase: 'relationships',
      }),
  })
  await each({
    label: 'frozen-and-latest-versions',
    run: ({ ordinal }) => {
      const parent = getPerformanceLogicalID({ ordinal })
      const addVersion = ({
        revision,
        data,
        isLatest = false,
      }: {
        data: Record<string, unknown>
        isLatest?: boolean
        revision: number
      }) => {
        const { id: _logicalID, ...body } = data

        loader.add({
          entity: versionsEntity,
          data: {
            id: versionID({ ordinal, revision }),
            parent,
            version: body,
            latest: isLatest,
            branchOnly: !isLatest,
            branchGeneration: isLatest ? null : 1,
            branchFrozen: !isLatest,
            branchOwnerKey: isLatest ? null : getBranchKey({ branchID: 'main' }),
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        })
      }

      addVersion({ revision: 1, data: dataFor({ ordinal, hasOverride: false }) })
      if (hasPerformanceOverride({ ordinal, scenario })) {
        addVersion({ revision: 2, data: dataFor({ ordinal, hasOverride: true }) })
      }
      addVersion({
        revision: 3,
        data: effective({ ordinal }),
        isLatest: true,
      })
      if (ordinal % 100 === 0) {
        for (let revision = 4; revision < 104; revision++) {
          addVersion({ revision, data: dataFor({ ordinal, hasOverride: false }) })
        }
      }
    },
  })
  // Relationship rows in historical versions are real, and use the same logical targets.
  await each({
    label: 'version-relationships',
    run: ({ ordinal }) => {
      for (const revision of [
        1,
        ...(hasPerformanceOverride({ ordinal, scenario }) ? [2] : []),
        3,
        ...(ordinal % 100 === 0 ? Array.from({ length: 100 }, (_, index) => index + 4) : []),
      ]) {
        const data =
          revision === 3
            ? effective({ ordinal })
            : dataFor({ ordinal, hasOverride: revision === 2 })

        loader.add({
          entity: versionsEntity,
          data: {
            id: versionID({ ordinal, revision }),
            parent: getPerformanceLogicalID({ ordinal }),
            version: data,
          },
          phase: 'relationships',
        })
      }
    },
  })
  let headCount = 0
  let pinCount = 0

  await each({
    label: 'heads-and-pins',
    run: ({ ordinal }) => {
      const parent = getPerformanceLogicalID({ ordinal })
      const writeHead = ({
        branchID,
        scope,
        revision,
      }: {
        branchID: string
        revision: number
        scope: (typeof scopes)[number]
      }) => {
        const scopeKey = scope.type === 'shared' ? 'shared' : `locale:${scope.locale}`
        const rootKey = `head:${getBranchKey({ branchID })}:${scopeKey}:0:1`
        const ref = versionID({ ordinal, revision })

        add({
          slug: storage.heads,
          data: {
            id: nativeID({ ordinal: ++headCount }),
            parent,
            coordinateKey: getBranchStorageKey({
              coordinates: [parent, getBranchKey({ branchID }), scopeKey],
            }),
            branchKey: getBranchKey({ branchID }),
            scopeKey,
            generation: 1,
            incarnation: 0,
            state: 'version',
            versionID: ref,
            versionGeneration: 1,
            base: null,
          },
        })
        add({
          slug: storage.pins,
          data: {
            id: nativeID({ ordinal: ++pinCount }),
            parent,
            rootKey,
            referenceKey: getBranchStorageKey({ coordinates: [ref, rootKey] }),
            versionID: ref,
            versionGeneration: 1,
          },
        })
      }

      for (const scope of scopes) {
        writeHead({ branchID: 'main', scope, revision: 1 })
      }
      if (hasPerformanceOverride({ ordinal, scenario })) {
        for (const branchID of branches) {
          writeHead({ branchID, scope: { type: 'locale', locale: 'fr' }, revision: 2 })
        }
      }
    },
  })
  for (const branchID of ['main', ...branches]) {
    const cacheData = ({ ordinal }: { ordinal: number }) =>
      encodeBranchProjectionDocument({
        blocks: payload.config.blocks,
        branchID,
        data:
          branchID === 'main'
            ? composeBranchProjection({
                fields,
                isStatusLocalized: true,
                logicalID: getPerformanceLogicalID({ ordinal }),
                scopes: scopes.map((scope) => ({
                  scope,
                  main: {
                    type: 'version',
                    version: { id: versionID({ ordinal, revision: 1 }), generation: 1 },
                    structure: null,
                  },
                  selected: {
                    type: 'version',
                    version: { id: versionID({ ordinal, revision: 1 }), generation: 1 },
                    structure: null,
                  },
                })),
                versions: [
                  {
                    reference: { id: versionID({ ordinal, revision: 1 }), generation: 1 },
                    data: dataFor({ ordinal, hasOverride: false }),
                  },
                ],
              }).data
            : effective({ ordinal }),
        fields: source.fields,
        projectionSlugs: { [performanceSlug]: control.projection },
      })

    await each({
      label: `projection-content:${branchID}`,
      run: ({ ordinal }) =>
        loader.add({
          entity: { slug: cache.slug, fields: cache.fields },
          data: cacheData({ ordinal }),
        }),
    })
    await each({
      label: `projection-relationships:${branchID}`,
      run: ({ ordinal }) =>
        loader.add({
          entity: { slug: cache.slug, fields: cache.fields },
          data: cacheData({ ordinal }),
          phase: 'relationships',
        }),
    })
  }
  await loader.finish()
  const req = await createPayloadRequest({ payload })
  const transactionID = await payload.db.beginTransaction()

  if (transactionID === null) {
    throw new Error('The performance fixture requires native caller transactions.')
  }
  req.transactionID = transactionID
  try {
    for (const branchID of ['main', ...branches]) {
      await registerBranchProjectionScopes({ branchID, control, req, scopes })
      for (const scope of scopes) {
        await initializeBranchProjectionScope({ branchID, control, req, scope })
      }
    }
    await payload.db.commitTransaction(transactionID)
  } finally {
    if (payload.db.sessions?.[transactionID]) {
      await payload.db.rollbackTransaction(transactionID)
    }
  }

  return { effective, headCount, pinCount, ...loader.metrics, versionID }
}
