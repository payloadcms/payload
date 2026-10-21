import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'

type Fixture = {
  tables: Record<string, Record<string, null | number | string>[]>
  views: Record<string, Record<string, unknown>>
}

for (const { generation, liveStatus, workingStatus, statusQuery, statusRows } of [
  {
    generation: 'released-v3.91.0',
    liveStatus: 'published',
    workingStatus: 'draft',
    statusQuery: "SELECT _status FROM articles WHERE id = 'published'",
    statusRows: [{ _status: 'published' }],
  },
  {
    generation: 'current-v4.0.0-beta.3',
    liveStatus: { en: 'published', fr: 'published' },
    workingStatus: { en: 'draft', fr: 'draft' },
    statusQuery:
      "SELECT _status, _locale FROM articles_locales WHERE _parent_id = 'published' ORDER BY _locale",
    statusRows: [
      { _status: 'published', _locale: 'en' },
      { _status: 'published', _locale: 'fr' },
    ],
  },
]) {
  describe(`Authentic ${generation} drafts fixture`, () => {
    it('should replay its released SQLite schema and raw rows with intact history and pending jobs', async () => {
      const directory = new URL(`./fixtures/${generation}/`, import.meta.url)
      const [data, schema, provenanceText] = await Promise.all([
        readFile(new URL('data.json', directory), 'utf8'),
        readFile(new URL('schema.sql', directory), 'utf8'),
        readFile(new URL('provenance.json', directory), 'utf8'),
      ])
      const provenance = JSON.parse(provenanceText)
      const fixture = JSON.parse(data) as Fixture
      const db = new DatabaseSync(':memory:')

      try {
        expect(createHash('sha256').update(data).digest('hex')).toBe(provenance.sha256['data.json'])
        expect(createHash('sha256').update(schema).digest('hex')).toBe(
          provenance.sha256['schema.sql'],
        )
        expect(provenance.packages.payload.version).toBe(provenance.release)
        expect(provenance.packages['@payloadcms/db-sqlite'].version).toBe(provenance.release)
        db.exec(schema)
        db.exec('PRAGMA foreign_keys = OFF')

        for (const [table, rows] of Object.entries(fixture.tables)) {
          for (const row of rows) {
            const columns = Object.keys(row)
            const insert = db.prepare(
              `INSERT INTO "${table}" (${columns.map((column) => `"${column}"`).join(',')}) VALUES (${columns.map(() => '?').join(',')})`,
            )

            insert.run(...Object.values(row))
          }
        }

        db.exec('PRAGMA foreign_keys = ON')
        expect(db.prepare('PRAGMA foreign_key_check').all()).toStrictEqual([])
        expect(db.prepare('SELECT count(*) AS count FROM articles').get()).toMatchObject({
          count: 2,
        })
        expect(
          db.prepare('SELECT count(*) AS count FROM _articles_v').get()?.count,
        ).toBeGreaterThan(3)
        expect(
          db.prepare('SELECT count(*) AS count FROM _settings_v').get()?.count,
        ).toBeGreaterThanOrEqual(2)

        const jobs = db
          .prepare('SELECT input, completed_at, wait_until FROM payload_jobs ORDER BY id')
          .all()

        expect(jobs).toHaveLength(2)
        expect(JSON.parse(String(jobs[0]!.input))).toMatchObject({
          doc: { relationTo: 'articles', value: 'published' },
          locale: 'en',
          type: 'publish',
        })
        expect(JSON.parse(String(jobs[1]!.input))).toMatchObject({
          global: 'settings',
          type: 'unpublish',
        })
        expect(
          jobs.every(
            (job) => job.completed_at === null && String(job.wait_until).startsWith('2030-'),
          ),
        ).toBe(true)
        expect(fixture.views.live?.title).toStrictEqual({ en: 'English live', fr: 'French live' })
        expect(fixture.views.working?.title).toStrictEqual({
          en: 'Latest English autosave',
          fr: 'French working',
        })

        expect(fixture.views.live?._status).toStrictEqual(liveStatus)
        expect(fixture.views.working?._status).toStrictEqual(workingStatus)
        expect(db.prepare(statusQuery).all()).toMatchObject(statusRows)
      } finally {
        db.close()
      }
    })
  })
}
