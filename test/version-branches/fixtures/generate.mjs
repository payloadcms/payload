// Run from an isolated directory containing exactly the released dependencies in package-lock.json.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const releaseRoot = resolve(process.argv[2])
const outputDirectory = resolve(process.argv[3])
const releaseVersion = process.argv[4] ?? '3.91.0'
const requireRelease = createRequire(resolve(releaseRoot, 'package.json'))
const { buildConfig, getPayload } = await import(pathToFileURL(requireRelease.resolve('payload')))
const { sqliteAdapter } = await import(
  pathToFileURL(requireRelease.resolve('@payloadcms/db-sqlite'))
)
const { createClient } = await import(pathToFileURL(requireRelease.resolve('@libsql/client')))
const lock = JSON.parse(await readFile(resolve(releaseRoot, 'package-lock.json'), 'utf8'))

for (const name of ['payload', '@payloadcms/db-sqlite']) {
  assert.equal(lock.packages[`node_modules/${name}`].version, releaseVersion)
}

const RealDate = Date
let clock = RealDate.parse('2026-10-15T12:00:00.000Z')

globalThis.Date = class extends RealDate {
  constructor(...args) {
    super(...(args.length ? args : [clock]))
  }
  static now() {
    return clock
  }
}

const advanceClock = () => {
  clock += 1000
}
const databasePath = resolve(releaseRoot, 'released-fixture.db')
await rm(databasePath, { force: true })
const databaseURL = `file:${databasePath}`
const fields = [
  { name: 'shared', type: 'text' },
  { name: 'title', type: 'text', localized: true, required: true },
  {
    name: 'sections',
    type: 'array',
    fields: [
      { name: 'label', type: 'text' },
      { name: 'translation', type: 'text', localized: true },
    ],
  },
]
const config = await buildConfig({
  secret: 'released-fixture-only',
  telemetry: false,
  admin: { disable: true },
  db: sqliteAdapter({ client: { url: databaseURL }, push: true }),
  collections: [
    {
      slug: 'articles',
      access: { create: () => true, read: () => true, update: () => true },
      fields: [{ name: 'id', type: 'text' }, ...fields],
      versions: { drafts: { autosave: true, schedulePublish: true }, maxPerDoc: 1000 },
    },
  ],
  globals: [
    {
      slug: 'settings',
      access: { read: () => true, update: () => true },
      fields,
      versions: { drafts: { autosave: true, schedulePublish: true }, max: 1000 },
    },
  ],
  localization: { defaultLocale: 'en', fallback: false, locales: ['en', 'fr'] },
})
const payload = await getPayload({ config, disableOnInit: true })

await payload.create({
  collection: 'articles',
  data: {
    id: 'published',
    _status: 'published',
    shared: 'live shared',
    title: 'English live',
    sections: [{ id: 'row-a', label: 'Live label', translation: 'English row' }],
  },
  locale: 'en',
})
advanceClock()
await payload.update({
  collection: 'articles',
  id: 'published',
  data: {
    _status: 'published',
    title: 'French live',
    sections: [{ id: 'row-a', label: 'Live label', translation: 'French row' }],
  },
  locale: 'fr',
})
advanceClock()
await payload.update({
  collection: 'articles',
  id: 'published',
  data: { title: 'French working' },
  draft: true,
  locale: 'fr',
})
advanceClock()
await payload.update({
  collection: 'articles',
  id: 'published',
  data: { shared: 'working shared', title: 'English autosave' },
  draft: true,
  autosave: true,
  locale: 'en',
})
advanceClock()
await payload.update({
  collection: 'articles',
  id: 'published',
  data: { title: 'Latest English autosave' },
  draft: true,
  autosave: true,
  locale: 'en',
})
advanceClock()
await payload.create({
  collection: 'articles',
  data: { id: 'unpublished', shared: 'Incomplete working document' },
  draft: true,
  locale: 'en',
})
advanceClock()
await payload.updateGlobal({
  slug: 'settings',
  data: { _status: 'published', title: 'Global live', shared: 'Global shared' },
  locale: 'en',
})
advanceClock()
await payload.updateGlobal({
  slug: 'settings',
  data: { title: 'Global working' },
  draft: true,
  locale: 'en',
})
advanceClock()
await payload.jobs.queue({
  task: 'schedulePublish',
  overrideAccess: true,
  input: { doc: { relationTo: 'articles', value: 'published' }, locale: 'en', type: 'publish' },
  waitUntil: new Date('2030-01-01T00:00:00.000Z'),
})
await payload.jobs.queue({
  task: 'schedulePublish',
  overrideAccess: true,
  input: { global: 'settings', type: 'unpublish' },
  waitUntil: new Date('2030-01-02T00:00:00.000Z'),
})

const views = {
  live: await payload.findByID({
    collection: 'articles',
    id: 'published',
    locale: 'all',
    fallbackLocale: false,
  }),
  working: await payload.findByID({
    collection: 'articles',
    id: 'published',
    locale: 'all',
    fallbackLocale: false,
    draft: true,
  }),
  globalLive: await payload.findGlobal({ slug: 'settings', locale: 'all', fallbackLocale: false }),
  globalWorking: await payload.findGlobal({
    slug: 'settings',
    locale: 'all',
    fallbackLocale: false,
    draft: true,
  }),
}
await payload.destroy()

const client = createClient({ url: databaseURL })
const schema = (
  await client.execute(
    "SELECT name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type DESC, name",
  )
).rows
const tables = {}
for (const entry of schema.filter(({ sql }) => sql.startsWith('CREATE TABLE'))) {
  // Auth and internal admin state do not participate in this fixture's content upgrade.
  if (!/^(articles|_articles|settings|_settings|payload_jobs)/.test(entry.name)) continue
  tables[entry.name] = (await client.execute(`SELECT * FROM "${entry.name}" ORDER BY rowid`)).rows
}
client.close()
const fixture = { views, tables }
const data = `${JSON.stringify(fixture, null, 2)}\n`
const ddl = `${schema.map(({ sql }) => `${sql};`).join('\n\n')}\n`
await mkdir(outputDirectory, { recursive: true })
await writeFile(resolve(outputDirectory, 'data.json'), data)
await writeFile(resolve(outputDirectory, 'schema.sql'), ddl)
await writeFile(
  resolve(outputDirectory, 'provenance.json'),
  `${JSON.stringify(
    {
      release: releaseVersion,
      packages: Object.fromEntries(
        ['payload', '@payloadcms/db-sqlite'].map((name) => [
          name,
          lock.packages[`node_modules/${name}`],
        ]),
      ),
      sha256: {
        'data.json': createHash('sha256').update(data).digest('hex'),
        'schema.sql': createHash('sha256').update(ddl).digest('hex'),
      },
    },
    null,
    2,
  )}\n`,
)
