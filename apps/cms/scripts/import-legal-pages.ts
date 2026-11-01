/**
 * Adds the Privacy Policy and Terms of Use of the VgemsAI app and the Vigor website to Pages, as
 * drafts (README: "Privacy policy and terms of use").
 *
 *   pnpm payload run scripts/import-legal-pages.ts --dry-run   # only show what would happen
 *   pnpm payload run scripts/import-legal-pages.ts             # import
 *   pnpm payload run scripts/import-legal-pages.ts --update    # also replace the text of pages that exist
 *
 * On the server, deploy/import-legal-pages.sh runs this inside Docker.
 *
 * The texts in scripts/legal/*.md are only their first version: from then on, they're edited in the
 * admin panel. Each has spots such as **[ADD CONTACT EMAIL]** to fill in there before publishing.
 * `[text](page:<slug>)` in a text links to another of these pages, wherever it is shown.
 *
 * A page that already exists with the same slug is skipped, so running it again is safe and keeps
 * your edits. With --update, the text here is saved as a new draft of it instead, for both sites;
 * the published version stays live until that draft is published, and the earlier text stays under
 * Versions.
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

type LexicalNode = {
  children?: LexicalNode[]
  fields?: { url?: string } & Record<string, unknown>
  type?: string
} & Record<string, unknown>

const OPTIONS = ['--dry-run', '--update']
/** The VgemsAI app and the Vigor website (src/sites.ts) */
const SITES: Page['sites'] = ['ios-app', 'vigor']
const TEXTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'legal')
/** What to fill in before publishing, e.g. [ADD CONTACT EMAIL] */
const PLACEHOLDER = /\[ADD [A-Z ]+\]/g
const PAGE_LINK = 'page:'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const update = args.includes('--update')
// A mistyped --dry-run must not run a real import
const unknownArgs = args.filter((arg) => !OPTIONS.includes(arg))

if (unknownArgs.length) {
  console.error(`Unknown option: ${unknownArgs.join(' ')}`)
  console.error('Usage: pnpm payload run scripts/import-legal-pages.ts [--dry-run] [--update]')
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

// Imports don't tell the websites: drafts aren't shown there
const context = { disableRevalidate: true }
const editorConfig = editorConfigFactory.fromField({
  field: payload.collections.pages.config.flattenedFields.find(
    (field) => field.name === 'content',
  ) as RichTextField,
})
// Sorted, so that a page is saved before the pages that link to it
const files = (await readdir(TEXTS_DIR)).filter((file) => file.endsWith('.md')).sort()
/** IDs of the pages saved so far, by slug, for `page:` links */
const pageIDs = new Map<string, string>()
let added = 0
let skipped = 0
let updated = 0

if (dryRun) {
  console.log('Dry run: nothing is saved.\n')
}

for (const file of files) {
  const { content: markdown, data } = matter(await readFile(path.join(TEXTS_DIR, file), 'utf8'))
  const { description, slug, title } = data as Pick<Page, 'description' | 'slug' | 'title'>
  const placeholders = [...new Set(markdown.match(PLACEHOLDER))]

  const { docs } = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { and: [{ slug: { equals: slug } }, { sites: { in: SITES } }] },
  })
  const existing = docs[0]

  if (existing && !update) {
    skipped++
    pageIDs.set(slug, existing.id)
    console.log(`  skip    ${title}  [already exists; --update replaces its text]`)
    continue
  }

  if (existing) {
    updated++
    console.log(`  update  ${title}  (as a new draft)`)
  } else {
    added++
    console.log(`  add     ${title}`)
  }

  if (placeholders.length) {
    console.log(`          fill in: ${placeholders.join(', ')}`)
  }

  if (dryRun) {
    continue
  }

  const lexical = convertMarkdownToLexical({
    editorConfig: editorConfig as SanitizedServerEditorConfig,
    markdown,
  })
  const pageData = {
    _status: 'draft' as const,
    content: {
      ...lexical,
      root: linkPages({ node: lexical.root as unknown as LexicalNode }),
    } as unknown as Page['content'],
    description,
    sites: [...new Set([...(existing?.sites ?? []), ...SITES])],
    slug,
    title,
  }

  const saved = existing
    ? await payload.update({
        id: existing.id,
        collection: 'pages',
        context,
        data: pageData,
        draft: true,
        overrideAccess: true,
      })
    : await payload.create({
        collection: 'pages',
        context,
        data: pageData,
        draft: true,
        overrideAccess: true,
      })

  pageIDs.set(slug, saved.id)
}

console.log(
  `\n${dryRun ? 'Would add' : 'Added'} ${added} and ${dryRun ? 'update' : 'updated'} ${updated} pages as drafts, skipped ${skipped} that already exist.`,
)

if (added || updated) {
  const { serverURL } = payload.config
  console.log(
    `Next: open each one under Pages in the admin panel, replace every [ADD …] and press Publish.
Then they're at ${serverURL}/ios-app/<slug> for the app, and at /<slug> on the Vigor website.`,
  )
}

process.exit(0)

/** `[text](page:<slug>)` becomes a link to that page, which each site points to its own address */
function linkPages({ node }: { node: LexicalNode }): LexicalNode {
  const children = node.children?.map((child) => linkPages({ node: child }))
  const { url, ...fields } = node.fields ?? {}

  if (node.type !== 'link' || !url?.startsWith(PAGE_LINK)) {
    return children ? { ...node, children } : node
  }

  const slug = url.slice(PAGE_LINK.length)
  const id = pageIDs.get(slug)

  if (!id) {
    throw new Error(`A link points to the page "${slug}", which isn't in scripts/legal.`)
  }

  return {
    ...node,
    children,
    fields: { ...fields, doc: { relationTo: 'pages', value: id }, linkType: 'internal' },
  }
}
