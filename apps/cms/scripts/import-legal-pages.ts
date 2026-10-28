/**
 * Adds the VgemsAI app's Privacy Policy and Terms of Use to Pages, for the iOS app, as drafts
 * (README: "Privacy policy and terms of use").
 *
 *   pnpm payload run scripts/import-legal-pages.ts --dry-run   # only show what would happen
 *   pnpm payload run scripts/import-legal-pages.ts             # import
 *
 * On the server, deploy/import-legal-pages.sh runs this inside Docker.
 *
 * The texts in scripts/legal/*.md are only their first version: from then on, they're edited in the
 * admin panel. Each has spots such as **[ADD CONTACT EMAIL]** to fill in there before publishing.
 * A page that the iOS app already has with the same slug is skipped, so running it again is safe
 * and keeps your edits.
 */
/* eslint-disable no-console -- a command-line script */
import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical'
import type { RichTextField } from 'payload'

import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { readdir, readFile } from 'fs/promises'
import matter from 'gray-matter'
import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'

import type { Page } from '../src/payload-types'

import config from '../src/payload.config'

const SITE = 'ios-app'
const TEXTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'legal')
/** What to fill in before publishing, e.g. [ADD CONTACT EMAIL] */
const PLACEHOLDER = /\[ADD [A-Z ]+\]/g

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
// A mistyped --dry-run must not run a real import
const unknownArgs = args.filter((arg) => arg !== '--dry-run')

if (unknownArgs.length) {
  console.error(`Unknown option: ${unknownArgs.join(' ')}`)
  console.error('Usage: pnpm payload run scripts/import-legal-pages.ts [--dry-run]')
  process.exit(1)
}

const payload = await getPayload({ config })

// On a new database, MongoDB is still creating collections and indexes in the background, and a
// write in a transaction meanwhile fails with "Transaction ... has been aborted". An index that
// can't be built, e.g. because an older one with the same name exists, doesn't stop the import.
const models = Object.values((payload.db as MongooseAdapter).connection.models)
const indexBuilds = await Promise.allSettled(models.map((model) => model.init()))

indexBuilds.forEach((result, index) => {
  if (result.status === 'rejected') {
    console.warn(
      `Warning: MongoDB couldn't build an index in "${models[index]!.collection.name}" (README: "Troubleshooting"): ${result.reason instanceof Error ? result.reason.message : String(result.reason)}\n`,
    )
  }
})

const editorConfig = editorConfigFactory.fromField({
  field: payload.collections.pages.config.flattenedFields.find(
    (field) => field.name === 'content',
  ) as RichTextField,
})
const files = (await readdir(TEXTS_DIR)).filter((file) => file.endsWith('.md')).sort()
let added = 0
let skipped = 0

if (dryRun) {
  console.log('Dry run: nothing is saved.\n')
}

for (const file of files) {
  const { content: markdown, data } = matter(await readFile(path.join(TEXTS_DIR, file), 'utf8'))
  const { description, slug, title } = data as Pick<Page, 'description' | 'slug' | 'title'>

  const { docs } = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { and: [{ slug: { equals: slug } }, { sites: { in: [SITE] } }] },
  })

  if (docs[0]) {
    skipped++
    console.log(`  skip  ${title}  [the iOS app already has a page "${slug}"]`)
    continue
  }

  added++
  console.log(`  add   ${title}  (${payload.config.serverURL}/${SITE}/${slug} once published)`)

  const placeholders = [...new Set(markdown.match(PLACEHOLDER))]

  if (placeholders.length) {
    console.log(`        fill in: ${placeholders.join(', ')}`)
  }

  if (!dryRun) {
    await payload.create({
      collection: 'pages',
      data: {
        _status: 'draft',
        content: convertMarkdownToLexical({
          editorConfig: editorConfig as SanitizedServerEditorConfig,
          markdown,
        }) as Page['content'],
        description,
        sites: [SITE],
        slug,
        title,
      },
      draft: true,
      overrideAccess: true,
    })
  }
}

console.log(
  `\n${dryRun ? 'Would add' : 'Added'} ${added} pages as drafts, skipped ${skipped} that already exist.`,
)

if (added) {
  console.log(
    'Next: open each one under Pages in the admin panel, replace every [ADD …] and press Publish.',
  )
}

process.exit(0)
