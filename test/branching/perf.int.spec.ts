import type { Payload } from 'payload'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { branchesSlug, excludedSlug, headerGlobalSlug, pagesSlug, postsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

/**
 * How many database queries branching costs, per operation.
 *
 * A budget rather than a benchmark: the numbers are asserted, so adding a query to a hot
 * path fails here with the count that changed. Wall-clock timings would be noise on CI;
 * query counts are exact, and they are the thing that scales.
 *
 * The same numbers hold on MongoDB and SQLite. When one legitimately changes, update the
 * expectation and the table in `CONTENT_BRANCHING_PLAN.md` together.
 */
const METHODS = [
  'count',
  'countVersions',
  'create',
  'createGlobal',
  'createVersion',
  'deleteBranchGlobal',
  'deleteMany',
  'deleteOne',
  'deleteVersions',
  'find',
  'findDistinct',
  'findGlobal',
  'findGlobalVersions',
  'findOne',
  'findVersions',
  'queryDrafts',
  'updateGlobal',
  'updateMany',
  'updateOne',
  'updateVersion',
  'upsert',
]

let recording = false
let calls: string[] = []

const install = () => {
  for (const method of METHODS) {
    const original = (payload.db as Record<string, any>)[method]

    if (typeof original !== 'function') {
      continue
    }

    ;(payload.db as Record<string, any>)[method] = function (args: any, ...rest: any[]) {
      if (recording) {
        const slug = args?.collection ?? args?.global ?? args?.globalSlug ?? '—'

        calls.push(`${method}:${slug}`)
      }

      return original.call(this, args, ...rest)
    }
  }
}

const measure = async (fn: () => Promise<unknown>) => {
  calls = []
  recording = true

  try {
    await fn()
  } finally {
    recording = false
  }

  const branching = calls.filter(
    (call) => call.includes('payload-branch') || call.includes(branchesSlug),
  ).length

  return { branching, calls: calls.slice(), total: calls.length }
}

const rows: string[] = []

const record = ({
  branch,
  label,
  main,
}: {
  branch: { branching: number; total: number }
  label: string
  main?: { total: number }
}) => {
  rows.push(
    `| ${label} | ${main ? main.total : '—'} | ${branch.total} (${branch.branching} branching) | ${
      main ? `+${branch.total - main.total}` : '—'
    } |`,
  )
}

describe('Branching query cost', () => {
  const branch = 'perfwork'

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
    install()

    await payload.create({ collection: branchesSlug, data: { name: 'Perf', slug: branch } })
  })

  it('should add one query per request to reads, and none on main', async () => {
    const post = await payload.create({ collection: postsSlug, data: { title: 'main' } })
    const page = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', title: 'main' },
    })

    const reads = [
      {
        label: 'find',
        onBranch: () => payload.find({ branch, collection: postsSlug, pagination: false }),
        onMain: () => payload.find({ collection: postsSlug, pagination: false }),
        overhead: 1,
      },
      {
        label: 'findByID',
        onBranch: () => payload.findByID({ id: post.id, branch, collection: postsSlug }),
        onMain: () => payload.findByID({ id: post.id, collection: postsSlug }),
        overhead: 1,
      },
      {
        label: 'count',
        onBranch: () => payload.count({ branch, collection: postsSlug }),
        onMain: () => payload.count({ collection: postsSlug }),
        overhead: 1,
      },
      {
        label: 'findDistinct',
        onBranch: () => payload.findDistinct({ branch, collection: postsSlug, field: 'title' }),
        onMain: () => payload.findDistinct({ collection: postsSlug, field: 'title' }),
        overhead: 1,
      },
      {
        label: 'find (drafts)',
        onBranch: () =>
          payload.find({ branch, collection: pagesSlug, draft: true, pagination: false }),
        onMain: () => payload.find({ collection: pagesSlug, draft: true, pagination: false }),
        overhead: 1,
      },
      {
        // Version *history* is resolved synchronously — main's versions are the branch's
        // ancestry, so there is no manifest to load.
        label: 'findVersions',
        onBranch: () => payload.findVersions({ branch, collection: pagesSlug, pagination: false }),
        onMain: () => payload.findVersions({ collection: pagesSlug, pagination: false }),
        overhead: 0,
      },
      {
        // A global fetches both candidate rows in one query and picks.
        label: 'findGlobal',
        onBranch: () => payload.findGlobal({ slug: headerGlobalSlug, branch }),
        onMain: () => payload.findGlobal({ slug: headerGlobalSlug }),
        overhead: 0,
      },
    ]

    for (const read of reads) {
      const main = await measure(read.onMain)
      const onBranch = await measure(read.onBranch)

      record({ branch: onBranch, label: read.label, main })

      // `toMatchObject` rather than an assertion message: the extra keys are ignored when
      // it passes and printed when it fails, which is when the query list is wanted.
      expect({
        label: read.label,
        overhead: onBranch.total - main.total,
        queries: onBranch.calls,
      }).toMatchObject({ label: read.label, overhead: read.overhead })
    }
  })

  /**
   * The question this guards: does reading many documents on a branch cost more queries
   * than reading one? It must not — the predicate resolves the whole result set in the
   * database, so an N+1 would mean the union was being assembled in application code.
   */
  it('should cost the same for one document as for a page of them', async () => {
    const branchDocs: (number | string)[] = []
    const mainDocs: (number | string)[] = []

    for (let index = 0; index < 10; index++) {
      const doc = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: `n+1 main ${index}` },
      })

      mainDocs.push(doc.id)
    }

    // A mixed page: some documents read through to main, some are the branch's forks, some
    // the branch created, and one is tombstoned — every case the predicate has to resolve.
    for (const id of mainDocs.slice(0, 3)) {
      await payload.update({
        id,
        branch,
        collection: pagesSlug,
        data: { _status: 'published', title: 'forked' },
      })
    }

    for (let index = 0; index < 2; index++) {
      const doc = await payload.create({
        branch,
        collection: pagesSlug,
        data: { _status: 'published', title: `branch only ${index}` },
      })

      branchDocs.push(doc.id)
    }

    await payload.delete({ id: mainDocs[9]!, branch, collection: pagesSlug })

    const many = await measure(() =>
      payload.find({ branch, collection: pagesSlug, pagination: false }),
    )
    const one = await measure(() =>
      payload.find({ branch, collection: pagesSlug, limit: 1, pagination: false }),
    )
    const manyDrafts = await measure(() =>
      payload.find({ branch, collection: pagesSlug, draft: true, pagination: false }),
    )

    const page = await payload.find({ branch, collection: pagesSlug, pagination: false })

    record({ branch: many, label: 'find — 11 documents on a branch (mixed)' })
    record({ branch: manyDrafts, label: 'find (drafts) — 11 documents on a branch' })

    // Scoped to this test's own documents; earlier tests in the file leave pages behind.
    const mine = new Set([...mainDocs, ...branchDocs].map(String))
    const visible = page.docs.filter((doc) => mine.has(String(doc.id)))

    // 10 main rows read through, minus the tombstoned one, plus 2 the branch created. The 3
    // forks are the branch's copies of documents already counted, not extra rows.
    expect(visible).toHaveLength(11)

    expect({
      many: many.total,
      manyQueries: many.calls,
      one: one.total,
    }).toMatchObject({ many: 2, one: 2 })

    expect({ drafts: manyDrafts.total, draftsQueries: manyDrafts.calls }).toMatchObject({
      drafts: 2,
    })

    for (const id of [...mainDocs, ...branchDocs]) {
      await payload.delete({ id, branch: false, collection: pagesSlug }).catch(() => {})
    }
  })

  it('should pay the manifest once per request rather than once per read', async () => {
    const req = { branch } as never

    const shared = await measure(async () => {
      await payload.find({ branch, collection: postsSlug, pagination: false, req })
      await payload.find({ branch, collection: pagesSlug, pagination: false, req })
      await payload.find({ branch, collection: postsSlug, pagination: false, req })
    })

    record({ branch: shared, label: 'three reads sharing one request' })

    // Three content queries, one manifest.
    expect(shared.branching).toBe(1)
    expect(shared.total).toBe(4)
  })

  it('should cost nothing on a branchable collection read from main', async () => {
    const excluded = await measure(() =>
      payload.find({ collection: excludedSlug, pagination: false }),
    )
    const branchable = await measure(() =>
      payload.find({ collection: postsSlug, pagination: false }),
    )

    rows.push(
      `| find — excluded vs branchable collection, both on main | ${excluded.total} | ${branchable.total} | +${branchable.total - excluded.total} |`,
    )

    expect(branchable.total).toBe(excluded.total)
  })

  it('should fork once per document and charge later writes less', async () => {
    const doc = await payload.create({ collection: postsSlug, data: { title: 'to fork' } })
    const onMainDoc = await payload.create({ collection: postsSlug, data: { title: 'main only' } })

    const mainWrite = await measure(() =>
      payload.update({ id: onMainDoc.id, collection: postsSlug, data: { title: 'main 2' } }),
    )
    const firstWrite = await measure(() =>
      payload.update({ id: doc.id, branch, collection: postsSlug, data: { title: 'fork 1' } }),
    )
    const laterWrite = await measure(() =>
      payload.update({ id: doc.id, branch, collection: postsSlug, data: { title: 'fork 2' } }),
    )

    record({ branch: firstWrite, label: 'update — first write on branch (forks)', main: mainWrite })
    record({ branch: laterWrite, label: 'update — later writes on branch', main: mainWrite })

    expect({
      first: firstWrite.total - mainWrite.total,
      firstQueries: firstWrite.calls,
      later: laterWrite.total - mainWrite.total,
      laterQueries: laterWrite.calls,
    }).toMatchObject({ first: 5, later: 3 })
  })

  it('should charge a known amount for create, delete and global writes', async () => {
    const mainCreate = await measure(() =>
      payload.create({ collection: postsSlug, data: { title: 'm' } }),
    )
    const branchCreate = await measure(() =>
      payload.create({ branch, collection: postsSlug, data: { title: 'b' } }),
    )

    record({ branch: branchCreate, label: 'create', main: mainCreate })

    const toDeleteMain = await payload.create({ collection: postsSlug, data: { title: 'd1' } })
    const toDeleteBranch = await payload.create({ collection: postsSlug, data: { title: 'd2' } })

    const mainDelete = await measure(() =>
      payload.delete({ id: toDeleteMain.id, collection: postsSlug }),
    )
    const branchDelete = await measure(() =>
      payload.delete({ id: toDeleteBranch.id, branch, collection: postsSlug }),
    )

    record({ branch: branchDelete, label: 'delete (tombstone on branch)', main: mainDelete })

    // Warm the branch's copy of the global so the steady-state cost is what is measured.
    await payload.updateGlobal({ slug: headerGlobalSlug, branch, data: { navLabel: 'warm' } })
    await payload.updateGlobal({ slug: headerGlobalSlug, branch, data: { navLabel: 'warmer' } })

    const mainGlobal = await measure(() =>
      payload.updateGlobal({ slug: headerGlobalSlug, data: { navLabel: 'm' } }),
    )
    const branchGlobal = await measure(() =>
      payload.updateGlobal({ slug: headerGlobalSlug, branch, data: { navLabel: 'b' } }),
    )

    record({ branch: branchGlobal, label: 'updateGlobal — steady state', main: mainGlobal })

    expect({
      create: branchCreate.total - mainCreate.total,
      createQueries: branchCreate.calls,
      delete: branchDelete.total - mainDelete.total,
      deleteQueries: branchDelete.calls,
      global: branchGlobal.total - mainGlobal.total,
      globalQueries: branchGlobal.calls,
    }).toMatchObject({ create: 2, delete: 6, global: 1 })

    // Written for the humans reading `CONTENT_BRANCHING_PLAN.md`; the assertions above are
    // what actually guards the numbers.
    fs.writeFileSync(
      '/tmp/branch-perf.md',
      [
        '| Operation | On main | On a branch | Overhead |',
        '| --- | --- | --- | --- |',
        ...rows,
      ].join('\n'),
    )
  })
})
