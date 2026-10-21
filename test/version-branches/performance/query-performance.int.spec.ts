/* eslint-disable payload/no-relative-monorepo-imports -- Opt-in large-scale measurement of the experimental core boundary. */
import type { PayloadRequest, Where } from 'payload'

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { encodeBranchProjectionBranchKey } from '../../../packages/payload/src/versions/branches/queries/branchProjectionCodec.js'
import {
  compileBranchProjectionSort,
  compileBranchProjectionWhere,
} from '../../../packages/payload/src/versions/branches/queries/compileBranchProjectionWhere.js'
import {
  readBranchHeadToken,
  writeBranchHead,
} from '../../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { initializeBranchVersion } from '../../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../../__helpers/int/vitest.js'
import { attributeBranchPerformance } from './attribution.js'
import { profileBranchPerformance } from './cpuProfile.js'
import { getBranchPerformanceEnvironment } from './environment.js'
import { queryLegacyPerformanceGraph } from './graph.js'
import { instrumentBranchPerformance, readBranchPerformanceStorage } from './instrumentation.js'
import { readPerformanceGitState } from './provenance.mjs'
import {
  getPerformanceBranches,
  getPerformanceIterations,
  getPerformanceLogicalID,
  getPerformanceSampleOrdinals,
  getPerformanceScenario,
  performanceSlug,
  summarizePerformanceSamples,
} from './scenarios.js'
import { seedBranchPerformance } from './seed.js'
import { getPerformanceSourceDigest } from './sourceDigest.mjs'
import { verifyPerformanceSeed } from './verifySeed.js'

const isEnabled = process.env.PAYLOAD_BRANCH_PERF === 'true'

test.suite(
  'Opt-in native branch query performance gate',
  {
    config: './config.ts',
    db: (adapter) => isEnabled && ['mongodb', 'postgres', 'sqlite'].includes(adapter),
  },
  () => {
    test('should compare guarded effective queries with equivalent current drafts at native scale', async ({
      payload,
    }) => {
      const scenario = getPerformanceScenario()
      const { queryBranchContent } =
        await import('../../../packages/payload/src/versions/branches/queries/queryBranchContent.js')
      const { queryBranchContentGraph } =
        await import('../../../packages/payload/src/versions/branches/queries/queryBranchContentGraph.js')
      const environment = await getBranchPerformanceEnvironment({ payload })
      const iterations = getPerformanceIterations({ evidence: environment.evidence })
      const output = join(
        process.env.PAYLOAD_BRANCH_PERF_OUTPUT ?? '/private/tmp/payload-branch-performance',
        environment.evidence,
        environment.sourceDigest.value,
      )
      const key = `${process.env.PAYLOAD_DATABASE}-${scenario.documents}-${scenario.locales}-${scenario.branches}-${scenario.overrideDensity}`
      const profileKey = `${key}-${new Date().toISOString().replaceAll(':', '-')}`
      await mkdir(output, { recursive: true })
      await writeFile(
        join(output, `${key}-seed-start.json`),
        `${JSON.stringify({ scenario, environment, startedAt: new Date().toISOString() }, null, 2)}\n`,
      )
      console.log(
        JSON.stringify({
          event: 'branch-performance-start',
          key,
          evidence: environment.evidence,
          sourceDigest: environment.sourceDigest.value,
          output,
        }),
      )
      const started = performance.now()
      const seeded = await seedBranchPerformance({ payload, scenario })
      const seedMilliseconds = performance.now() - started
      const req = await createPayloadRequest({ payload })
      const source = payload.collections[performanceSlug]!.config
      const cacheSlug = source.custom.branchQueryStorage.projection
      const branchID = getPerformanceBranches({ scenario })[0]!
      const instrumentation = instrumentBranchPerformance({ payload })
      const report: Record<string, any> = {
        scenario,
        adapter: payload.db.name,
        measuredAt: new Date().toISOString(),
        distribution: {
          heavyDocuments: scenario.documents / 100,
          longHistoryDocuments: scenario.documents / 100,
          additionalHistoryRevisions: scenario.documents,
          highFanoutEdges: 32,
          ordinaryEdges: 1,
          nestedDepth: 3,
          overrides: scenario.overrideDensity,
        },
        seed: {
          milliseconds: seedMilliseconds,
          rows: seeded.insertedRows,
          calls: seeded.nativeCalls,
          heads: seeded.headCount,
          pins: seeded.pinCount,
        },
        measurements: [],
        environment,
      }
      report.storage = await readBranchPerformanceStorage({ payload })
      report.peakResidentSetKilobytes = process.resourceUsage().maxRSS
      await mkdir(output, { recursive: true })
      await writeFile(join(output, `${key}.json`), `${JSON.stringify(report, null, 2)}\n`)
      const native = payload.db.branching!.queryProjection!
      try {
        instrumentation.reset()
        report.seed.authoritativeSampleRebuild = {
          ...(await verifyPerformanceSeed({ payload, scenario })),
          verificationCalls: instrumentation.statements.length,
        }
        const count = await payload.db.count({ collection: performanceSlug })

        expect(count.totalDocs).toBe(scenario.documents)
        expect((await payload.db.count({ collection: cacheSlug })).totalDocs).toBe(
          scenario.documents * (scenario.branches + 1),
        )
        expect(
          (await payload.db.count({ collection: source.custom.branchStorage.heads })).totalDocs,
        ).toBe(seeded.headCount)
        expect(
          (await payload.db.count({ collection: source.custom.branchStorage.pins })).totalDocs,
        ).toBe(seeded.pinCount)

        const expectedVersions =
          scenario.documents * 3 + scenario.documents * scenario.overrideDensity

        expect(
          (await payload.db.countVersions({ collection: performanceSlug, where: {} })).totalDocs,
        ).toBe(expectedVersions)
        expect(
          (
            await payload.db.countVersions({
              collection: performanceSlug,
              where: { latest: { equals: true } },
            })
          ).totalDocs,
        ).toBe(scenario.documents)
        for (const ordinal of getPerformanceSampleOrdinals({ scenario })) {
          const logicalID = getPerformanceLogicalID({ ordinal })
          const target = { collection: source.custom.branchStorage.heads, parentID: logicalID }
          const token = await readBranchHeadToken({
            branchID: 'main',
            req,
            scope: { type: 'shared' },
            target,
          })
          const revision = await payload.db.findVersions({
            collection: performanceSlug,
            where: {
              and: [
                { id: { equals: seeded.versionID({ ordinal, revision: 1 }) } },
                { parent: { equals: logicalID } },
              ],
            },
          })

          expect(token.state).toMatchObject({
            type: 'version',
            version: { id: revision.docs[0]!.id, generation: 1 },
          })
          expect(revision.docs[0]!.branchFrozen).toBe(true)
          const effective = await queryBranchContent({
            branchID,
            collection: performanceSlug,
            req,
            locale: 'en',
            where: { id: { equals: logicalID } },
            overrideAccess: false,
          })

          expect(effective.docs).toHaveLength(1)
          const expectedContent = seeded.effective({ ordinal })

          if (!(expectedContent.content as unknown[]).length) {
            delete expectedContent.content
          }
          expect(effective.docs[0]).toMatchObject(expectedContent)
        }

        report.storage = await readBranchPerformanceStorage({ payload })
        const workloads: { locale?: 'en' | 'fr'; name: string; sort?: string; where: Where }[] = [
          {
            name: 'selective-indexed-page',
            where: {
              and: [
                { category: { equals: 17 } },
                { ordinal: { greater_than_equal: Math.floor(scenario.documents / 4) } },
              ],
            },
          },
          {
            name: 'range-page-and-total',
            where: { ordinal: { greater_than_equal: Math.floor(scenario.documents / 2) } },
          },
          {
            name: 'relationship-predicate',
            where: { 'related.ordinal': { greater_than_equal: scenario.documents - 100 } },
          },
          {
            name: 'nested-block-predicate',
            where: { 'content.items.children.value': { contains: 'en-value' } },
          },
        ]
        workloads.push({
          locale: 'fr',
          name: 'owned-locale-membership-and-sort',
          sort: 'title',
          where: { title: { contains: '-review' } },
        })
        for (const workload of workloads) {
          const locale = workload.locale ?? 'en'
          const sort = workload.sort ?? 'ordinal'
          const branches: { name: string; run: () => Promise<any> }[] = [
            {
              name: 'current-drafts-native',
              run: () =>
                payload.db.queryDrafts({
                  collection: performanceSlug,
                  locale,
                  limit: 20,
                  page: 1,
                  pagination: true,
                  req,
                  sort: `version.${sort}`,
                  where: prefixVersionWhere({
                    where: { and: [{ ordinal: { greater_than_equal: 0 } }, workload.where] },
                  }),
                }),
            },
            {
              name: 'branch-native',
              run: () =>
                native.find({
                  collection: cacheSlug,
                  locale,
                  limit: 20,
                  page: 1,
                  pagination: true,
                  req,
                  context: {
                    branchKey: encodeBranchProjectionBranchKey({ branchID }),
                    relationAccess: { [cacheSlug]: { ordinal: { greater_than_equal: 0 } } },
                  },
                  sort: compileBranchProjectionSort({
                    collection: performanceSlug,
                    req,
                    sort,
                  }),
                  where: compileBranchProjectionWhere({
                    branchID,
                    collection: performanceSlug,
                    req,
                    where: workload.where,
                  }),
                }),
            },
            {
              name: 'branch-guarded-core',
              run: async () =>
                (
                  await queryBranchContentGraph({
                    branchID,
                    collection: performanceSlug,
                    req,
                    locale,
                    limit: 20,
                    page: 1,
                    pagination: true,
                    sort,
                    where: workload.where,
                    overrideAccess: false,
                  })
                ).result,
            },
            {
              name: 'published-native',
              run: () =>
                payload.db.find({
                  collection: performanceSlug,
                  locale,
                  limit: 20,
                  page: 1,
                  pagination: true,
                  req,
                  sort,
                  where: { and: [{ ordinal: { greater_than_equal: 0 } }, workload.where] },
                }),
            },
          ]
          const baseline = await branches[0]!.run()
          const branch = await branches[2]!.run()

          expect(branch.docs.map((doc: any) => doc.id)).toEqual(
            baseline.docs.map((doc: any) => doc.id),
          )
          expect(branch.docs).toMatchObject(baseline.docs)
          expect(branch.totalDocs).toBe(baseline.totalDocs)
          expect(branch.totalDocs).toBe(
            workload.locale === 'fr'
              ? scenario.documents * scenario.overrideDensity
              : baseline.totalDocs,
          )
          expect(branch.docs[0]?.title?.[locale] ?? branch.docs[0]?.title).toEqual(
            baseline.docs[0]?.title?.[locale] ?? baseline.docs[0]?.title,
          )
          for (const method of branches) {
            for (let warmup = 0; warmup < 5; warmup++) {
              await method.run()
            }
            instrumentation.reset()
            const observed = await method.run()
            const calls = instrumentation.statements.length
            const operationStatements = instrumentation.statements.map((statement) => ({
              ...statement,
            }))
            const plans = await instrumentation.explain()
            const samples = []
            const wireSamples = []
            const before = process.memoryUsage()

            for (let iteration = 0; iteration < iterations; iteration++) {
              const firstStatement = instrumentation.statements.length
              const time = performance.now()

              await method.run()
              samples.push(performance.now() - time)
              wireSamples.push(
                instrumentation.statements
                  .slice(firstStatement)
                  .reduce((sum, statement) => sum + (statement.durationMilliseconds ?? 0), 0),
              )
            }
            const after = process.memoryUsage()

            report.measurements.push({
              workload: workload.name,
              method: method.name,
              iterations,
              calls,
              operationStatements,
              ...summarizePerformanceSamples({ samples }),
              samples,
              ...(payload.db.name === 'mongoose' ? { wireSamples } : {}),
              returnedDocuments: observed.docs.length,
              totalDocs: observed.totalDocs,
              locale,
              sort,
              memory: { before, after },
              plans,
            })
            await writeFile(join(output, `${key}.json`), `${JSON.stringify(report, null, 2)}\n`)
            console.log(
              JSON.stringify({
                key,
                workload: workload.name,
                method: method.name,
                calls,
                ...summarizePerformanceSamples({ samples }),
              }),
            )
          }
          if (workload.name === 'selective-indexed-page') {
            report.selectiveAttribution = await attributeBranchPerformance({
              iterations,
              payload,
              run: branches[2]!.run,
              source: performanceSlug,
              statements: instrumentation.statements,
            })
            if (process.env.PAYLOAD_BRANCH_PERF_PROFILE === 'true') {
              report.selectiveCPUProfile = await profileBranchPerformance({
                file: join(output, `${profileKey}-selective.cpuprofile`),
                iterations: Math.max(200, iterations),
                run: branches[2]!.run,
              })
            }
          }
        }
        const graphReq = await createPayloadRequest({ payload })
        graphReq.context.performanceDeniedOrdinals = Array.from(
          { length: 20 },
          (_, index) => index * 100 + 5,
        )
        const graphWhere: Where = {
          and: [{ category: { equals: 0 } }, { ordinal: { less_than: 2000 } }],
        }
        const graphMethods = [
          {
            name: 'current-drafts-native-raw-graph',
            run: () =>
              queryLegacyPerformanceGraph({
                req: graphReq,
                where: prefixVersionWhere({ where: graphWhere }),
              }),
          },
          {
            name: 'branch-guarded-core-raw-graph',
            run: () =>
              queryBranchContentGraph({
                branchID,
                collection: performanceSlug,
                depth: 2,
                req: graphReq,
                where: graphWhere,
                sort: 'ordinal',
                locale: 'en',
                limit: 20,
                page: 1,
                pagination: true,
                overrideAccess: false,
              }),
          },
        ]
        const legacyGraph = await graphMethods[0]!.run()
        const branchGraph = await graphMethods[1]!.run()
        if (!('rows' in legacyGraph) || !('graph' in branchGraph)) {
          throw new Error('Graph benchmark method contract mismatch.')
        }
        expect(branchGraph.result.docs).toMatchObject(legacyGraph.result.docs)
        for (const [id, doc] of legacyGraph.rows) {
          const actual = branchGraph.graph.get({ collection: performanceSlug, id })
          expect(actual ?? {}).toMatchObject(doc ?? {})
          expect(actual === null).toBe(doc === null)
        }
        expect(
          branchGraph.graph.get({
            collection: performanceSlug,
            id: getPerformanceLogicalID({ ordinal: 5 }),
          }),
        ).toBe(null)
        expect(branchGraph.result.docs[0]!.related).toContain(branchGraph.result.docs[0]!.id)
        expect(() =>
          branchGraph.graph.get({ collection: performanceSlug, id: 'unknown-coordinate' }),
        ).toThrow()
        report.graph = {
          depth: 2,
          roots: 20,
          coordinates: legacyGraph.rows.size,
          deniedTargets: 20,
          containsSelfCycles: true,
          measurements: [],
        }
        for (const method of graphMethods) {
          for (let warmup = 0; warmup < 5; warmup++) {
            await method.run()
          }
          instrumentation.reset()
          await method.run()
          const calls = instrumentation.statements.length
          const statements = instrumentation.statements.map((statement) => ({ ...statement }))
          const samples = []
          const memoryBefore = process.memoryUsage()
          for (let iteration = 0; iteration < iterations; iteration++) {
            const start = performance.now()
            await method.run()
            samples.push(performance.now() - start)
          }
          report.graph.measurements.push({
            method: method.name,
            iterations,
            calls,
            statements,
            samples,
            ...summarizePerformanceSamples({ samples }),
            memoryBefore,
            memoryAfter: process.memoryUsage(),
          })
          await writeFile(join(output, `${key}.json`), `${JSON.stringify(report, null, 2)}\n`)
        }
        instrumentation.reset()
        const graphTransaction = await payload.db.beginTransaction()
        if (graphTransaction === null) {
          throw new Error('Native caller transaction required for graph trace proof.')
        }
        const callerGraphReq = await createPayloadRequest({ payload })
        callerGraphReq.transactionID = graphTransaction
        callerGraphReq.context.performanceDeniedOrdinals =
          graphReq.context.performanceDeniedOrdinals
        try {
          const started = performance.now()
          const callerGraph = await queryBranchContentGraph({
            branchID,
            collection: performanceSlug,
            depth: 2,
            req: callerGraphReq,
            where: graphWhere,
            sort: 'ordinal',
            locale: 'en',
            limit: 20,
            page: 1,
            pagination: true,
            overrideAccess: false,
          })
          report.graph.existingCallerTransaction = {
            milliseconds: performance.now() - started,
            calls: instrumentation.statements.length,
            statements: instrumentation.statements.map((statement) => ({ ...statement })),
          }
          for (const [id, doc] of legacyGraph.rows) {
            const actual = callerGraph.graph.get({ collection: performanceSlug, id })
            expect(actual ?? {}).toMatchObject(doc ?? {})
            expect(actual === null).toBe(doc === null)
          }
        } finally {
          await payload.db.rollbackTransaction(graphTransaction)
        }
        report.graph.attribution = await attributeBranchPerformance({
          iterations,
          payload,
          run: graphMethods[1]!.run,
          source: performanceSlug,
          statements: instrumentation.statements,
        })
        if (process.env.PAYLOAD_BRANCH_PERF_PROFILE === 'true') {
          report.graph.cpuProfile = await profileBranchPerformance({
            file: join(output, `${profileKey}-graph.cpuprofile`),
            iterations: Math.max(100, iterations),
            run: graphMethods[1]!.run,
          })
        }
        report.graph.p95Ratio = report.graph.measurements[1].p95 / report.graph.measurements[0].p95
        report.graph.p50Ratio = report.graph.measurements[1].p50 / report.graph.measurements[0].p50
        report.graph.isWithinBudget = report.graph.p95Ratio <= 2 && report.graph.p50Ratio <= 2
        // Real authoritative mutation and automatic full derived maintenance, including all registered branches.
        for (const mutation of [
          { key: 'maintenance', ordinal: 1, title: 'Measured main maintenance' },
          { key: 'maintenanceHeavy', ordinal: 0, title: 'Measured heavy main maintenance' },
        ]) {
          instrumentation.reset()
          const mutationStarted = performance.now()
          const transactionID = await payload.db.beginTransaction()

          if (transactionID === null) {
            throw new Error('Native transaction required for measured maintenance.')
          }
          const mutationReq = (await createPayloadRequest({ payload })) as PayloadRequest

          mutationReq.transactionID = transactionID
          try {
            const logicalID = getPerformanceLogicalID({ ordinal: mutation.ordinal })
            const target = { collection: source.custom.branchStorage.heads, parentID: logicalID }
            const row = await payload.db.createVersion({
              autosave: false,
              branchMode: true,
              collectionSlug: performanceSlug,
              parent: logicalID,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              req: mutationReq,
              versionData: {
                ...seeded.effective({ ordinal: mutation.ordinal }),
                title: {
                  ...(seeded.effective({ ordinal: mutation.ordinal }).title as Record<
                    string,
                    unknown
                  >),
                  en: mutation.title,
                },
              },
            })
            const ref = await initializeBranchVersion({
              branchID: 'main',
              isFrozen: false,
              req: mutationReq,
              target,
              versionID: row.id,
            })
            const expected = await readBranchHeadToken({
              branchID: 'main',
              req: mutationReq,
              scope: { type: 'locale', locale: 'en' },
              target,
            })

            await writeBranchHead({
              expected,
              nextState: { type: 'version', version: ref, structure: null },
              req: mutationReq,
              target,
            })
            await payload.db.commitTransaction(transactionID)
            report[mutation.key] = {
              milliseconds: performance.now() - mutationStarted,
              calls: instrumentation.statements.length,
              writes: instrumentation.statements.filter(({ kind, sql }) =>
                /insert|update|delete|findAndModify|bulkWrite/i.test(sql ?? kind),
              ).length,
              branches: scenario.branches + 1,
              logicalDocumentsChanged: 1,
              acknowledgedAffectedRows: instrumentation.statements.reduce(
                (sum, statement) => sum + (statement.affectedRows ?? 0),
                0,
              ),
              statements: [...instrumentation.statements],
            }
            for (const affectedBranch of ['main', ...getPerformanceBranches({ scenario })]) {
              const actual = await queryBranchContent({
                branchID: affectedBranch,
                collection: performanceSlug,
                req,
                where: { id: { equals: logicalID } },
                overrideAccess: false,
              })
              expect(
                (actual.docs[0]?.title as Record<string, unknown>)?.en ?? actual.docs[0]?.title,
              ).toBe(mutation.title)
            }
            report[mutation.key].validatedBranchBodies = scenario.branches + 1
          } finally {
            if (payload.db.sessions?.[transactionID]) {
              await payload.db.rollbackTransaction(transactionID)
            }
          }
          report[mutation.key].storageAfter = await readBranchPerformanceStorage({ payload })
        }
        report.storageAfterMaintenance = await readBranchPerformanceStorage({ payload })
        report.peakResidentSetKilobytes = process.resourceUsage().maxRSS
        report.gate = workloads.map(({ name }) => {
          const measurements = report.measurements.filter(
            (measurement: any) => measurement.workload === name,
          )
          const baseline = measurements.find(
            (measurement: any) => measurement.method === 'current-drafts-native',
          )
          const branch = measurements.find(
            (measurement: any) => measurement.method === 'branch-guarded-core',
          )

          return {
            workload: name,
            p50Ratio: branch.p50 / baseline.p50,
            p95Ratio: branch.p95 / baseline.p95,
            isWithinBudget: branch.p95 <= baseline.p95 * 2 && branch.p50 <= baseline.p50 * 2,
          }
        })
        await mkdir(output, { recursive: true })
        await writeFile(join(output, `${key}.json`), `${JSON.stringify(report, null, 2)}\n`)
        console.log(
          JSON.stringify({
            key,
            seed: report.seed,
            measurements: report.measurements.map(({ workload, method, p50, p95, calls }: any) => ({
              workload,
              method,
              p50,
              p95,
              calls,
            })),
            maintenance: {
              milliseconds: report.maintenance.milliseconds,
              calls: report.maintenance.calls,
              writes: report.maintenance.writes,
              acknowledgedAffectedRows: report.maintenance.acknowledgedAffectedRows,
            },
            maintenanceHeavy: {
              milliseconds: report.maintenanceHeavy.milliseconds,
              calls: report.maintenanceHeavy.calls,
              writes: report.maintenanceHeavy.writes,
              acknowledgedAffectedRows: report.maintenanceHeavy.acknowledgedAffectedRows,
            },
            graph: {
              coordinates: report.graph.coordinates,
              p50Ratio: report.graph.p50Ratio,
              p95Ratio: report.graph.p95Ratio,
            },
            gate: report.gate,
          }),
        )
        const { paths, ...completedDigest } = await getPerformanceSourceDigest({
          includePaths: true,
        })
        report.environment.sourceDigestAtCompletion = completedDigest
        report.environment.gitAtCompletion = readPerformanceGitState({
          expectedHead: environment.expectedGitHead,
          requireTrackedSource: environment.evidence === 'final',
          sourcePaths: paths,
        })
        report.environment.isSourceUnchanged =
          report.environment.sourceDigestAtCompletion.value === environment.sourceDigest.value
        expect(report.environment.isSourceUnchanged).toBe(true)
        expect(report.gate.every(({ isWithinBudget }: any) => isWithinBudget)).toBe(true)
        expect(report.graph.isWithinBudget).toBe(true)
      } catch (error) {
        report.error = { message: String(error), code: (error as { code?: string }).code }
        throw error
      } finally {
        instrumentation.restore()
        // Keep evidence when a query, parity assertion or the budget fails.
        await mkdir(output, { recursive: true })
        await writeFile(join(output, `${key}.json`), `${JSON.stringify(report, null, 2)}\n`)
      }
    }, 3_600_000)
  },
)

const prefixVersionWhere = ({ where }: { where: Where }): Where =>
  Object.fromEntries(
    Object.entries(where).map(([key, value]) => [
      key === 'and' || key === 'or' ? key : `version.${key}`,
      Array.isArray(value) && (key === 'and' || key === 'or')
        ? value.map((entry) => prefixVersionWhere({ where: entry }))
        : value,
    ]),
  )
