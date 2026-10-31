/**
 * Copies the personal website's current content into the CMS (everything under "Personal
 * website"): Site settings, the Home, About, Services, Projects, Blog and Contact pages, and the
 * projects, with their images and icons. Projects are published, and saving a page puts it live.
 *
 *   pnpm payload run scripts/import-personal-website.ts <website-folder> --dry-run   # only show what would happen
 *   pnpm payload run scripts/import-personal-website.ts <website-folder>             # import
 *
 * <website-folder> is a checkout of the website repo (atorpos/personalwebsite). On the server,
 * deploy/import-personal-website.sh clones it and runs this inside Docker (README: "Personal
 * website").
 *
 * The pages come from content/*.md and theme.config.js, read the way the website reads them, and
 * the images and icons from public/. Pages that were already saved in the CMS, projects with the
 * same slug and files already in Media are skipped, so running it again is safe and keeps your
 * edits. Blog posts stay in content/blog; move the ones you want by hand (docs/payload-cms.md in
 * the website repo).
 */
/* eslint-disable no-console -- a command-line script */
import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical'
import type { GlobalSlug, RichTextField } from 'payload'

import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { randomBytes } from 'crypto'
import { existsSync } from 'fs'
import { readdir, readFile, stat } from 'fs/promises'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import path from 'path'
import { getPayload } from 'payload'

import config from '../src/payload.config'

/** Frontmatter and section data of the website's Markdown files, which aren't typed */
type Data = Record<string, any>
type Section = { content: string; data: Data }
/** A Markdown file of content/: frontmatter, the text before the first section, and the sections */
type MarkdownPage = { content: string; data: Data; sections: Record<string, Section | Section[]> }
type PersonalGlobal = Extract<GlobalSlug, `personal-${string}`>
type Result = { data: Data; summary?: string }

const OPTIONS = ['--dry-run']

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const websiteArg = args.find((arg) => !arg.startsWith('-'))
// A mistyped --dry-run must not run a real import
const unknownOptions = args.filter((arg) => arg.startsWith('-') && !OPTIONS.includes(arg))

if (unknownOptions.length) {
  console.error(`Unknown option: ${unknownOptions.join(' ')}`)
}

const websiteDir = websiteArg ? path.resolve(websiteArg) : ''

if (unknownOptions.length || !websiteArg) {
  console.error(
    'Usage: pnpm payload run scripts/import-personal-website.ts <website-folder> [--dry-run]',
  )
  console.error(
    '  e.g. pnpm payload run scripts/import-personal-website.ts ../../../personalwebsite --dry-run',
  )
  process.exit(1)
}

if (
  !existsSync(path.join(websiteDir, 'content')) ||
  !existsSync(path.join(websiteDir, 'theme.config.js'))
) {
  console.error(
    `${websiteDir} isn't the website repo: it has no content/ folder or theme.config.js.`,
  )
  process.exit(1)
}

const publicDir = path.join(websiteDir, 'public')

/** Icons of theme.config.js (react-icons) → the CMS's choices (src/personal/options.ts) */
const MENU_ICONS: Record<string, string> = {
  SlBriefcase: 'briefcase',
  SlEnvolope: 'envelope',
  SlTrophy: 'trophy',
  SlUser: 'user',
  TfiHome: 'home',
  TfiPencilAlt: 'pencil',
}
const SOCIAL_ICONS: Record<string, string> = {
  IoLogoFacebook: 'facebook',
  IoLogoGithub: 'github',
  IoLogoInstagram: 'instagram',
  IoLogoLinkedin: 'linkedin',
  IoLogoTwitter: 'x',
  IoLogoYoutube: 'youtube',
}
/** Icons of the contact details in content/contact.md (public/icons) → the CMS's detail types */
const CONTACT_ICONS: Record<string, string> = {
  call: 'phone',
  'logo-github': 'github',
  'logo-linkedin': 'linkedin',
  'logo-twitter': 'x',
  'logo-youtube': 'youtube',
  mail: 'email',
  'social-linkedin': 'linkedin',
  'social-twitter': 'x',
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

// Imports run without telling the website, which picks the content up on its own
const context = { disableRevalidate: true }
// Every rich text field of the personal website uses the same editor (src/personal/fields.ts)
const editorConfig = editorConfigFactory.fromField({
  field: payload.collections['personal-projects'].config.flattenedFields.find(
    (field) => field.name === 'content',
  ) as RichTextField,
})
/** Media IDs by path in public/, so every file is saved once */
const uploads = new Map<string, Promise<string | undefined>>()
/** Files are saved one after another, so the same file used twice is saved once */
let lastUpload: Promise<unknown> = Promise.resolve()
const notes: string[] = []
let added = 0
let failed = 0
let newFiles = 0
let skipped = 0

if (dryRun) {
  console.log('Dry run: nothing is saved.\n')
}

console.log(`Importing from ${websiteDir}\n`)

await importGlobal('personal-settings', 'Site settings', siteSettings)
await importGlobal('personal-home', 'Home page', homePage)
await importGlobal('personal-about', 'About page', aboutPage)
await importGlobal('personal-services', 'Services page', servicesPage)
await importGlobal('personal-projects-page', 'Projects page', projectsPage)
await importGlobal('personal-blog-page', 'Blog page', blogPage)
await importGlobal('personal-contact', 'Contact page', contactPage)
await importProjects()

console.log(
  `\n${dryRun ? 'Would add' : 'Added'}: ${added}. Skipped (already in the CMS): ${skipped}. New files in Media: ${newFiles}.`,
)

if (notes.length) {
  console.log(`\nTo check in the admin panel:\n${notes.map((note) => `  - ${note}`).join('\n')}`)
}

if (failed) {
  console.error(`\n${failed} could not be imported, see the errors above.`)
}

process.exit(failed ? 1 : 0)

/** Saves a page (global) unless it was saved in the CMS before */
async function importGlobal(
  slug: PersonalGlobal,
  label: string,
  build: () => Promise<Result | undefined>,
) {
  const current = await payload.findGlobal({ slug, depth: 0, overrideAccess: true })

  if (current.updatedAt) {
    skipped++
    console.log(`  skip   ${label}  [already saved in the CMS]`)
    return
  }

  try {
    const result = await build()

    if (!result) {
      console.log(`  skip   ${label}  [not in the website]`)
      return
    }

    if (!dryRun) {
      await payload.updateGlobal({
        slug,
        context,
        data: result.data as never,
        depth: 0,
        overrideAccess: true,
      })
    }

    added++
    console.log(
      `  ${dryRun ? 'new  ' : 'added'}  ${label}${result.summary ? `  (${result.summary})` : ''}`,
    )
  } catch (err) {
    failed++
    console.error(`  error  ${label}: ${describeError(err)}`)
  }
}

/** content/projects/*.md, published, unless a project with the same slug exists */
async function importProjects() {
  const folder = path.join(websiteDir, 'content', 'projects')
  const files = existsSync(folder)
    ? (await readdir(folder)).filter((file) => file.endsWith('.md')).sort()
    : []

  for (const file of files) {
    const slug = file.replace(/\.md$/, '')
    const { docs } = await payload.find({
      collection: 'personal-projects',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { slug: { equals: slug } },
    })

    if (docs[0]) {
      skipped++
      console.log(`  skip   Project: ${slug}  [already exists]`)
      continue
    }

    try {
      const page = await readPage(path.join('projects', file))
      const { data } = page!
      const where = `content/projects/${file}`
      const filesBefore = newFiles
      const images = toArray(data.images)
      const cover = images[0]
      // Before the text, so images used in both get the more descriptive alt text of the gallery
      const imageIDs = await uploadAll(images, where)
      const overlay = cover?.overlay?.src
        ? await upload(cover.overlay.src, cover.overlay.alt, where)
        : undefined
      let logo: string | undefined

      if (data.logo?.src && /\.svg$/i.test(data.logo.src)) {
        logo = await upload(data.logo.src, data.logo.alt || data.title, where)
      } else if (data.logo?.src) {
        notes.push(
          `Project "${data.title}": its logo ${data.logo.src} isn't an SVG, so it wasn't imported. Add an SVG logo, or leave it empty.`,
        )
      }

      const projectData = {
        _status: 'published',
        attributes: toArray(data.attributes).map(({ label, value }) => ({
          label: String(label),
          value: String(value),
        })),
        content: await toRichText(page!.content, where),
        date: toDay(data.date),
        description: data.description || '',
        images: imageIDs,
        logo,
        overlay,
        seo: seoOf(data),
        slug,
        tags: toArray(data.tags).map(String),
        title: data.title,
      }

      if (!dryRun) {
        await payload.create({
          collection: 'personal-projects',
          context,
          data: projectData as never,
          overrideAccess: true,
        })
      }

      added++
      console.log(
        `  ${dryRun ? 'new  ' : 'added'}  Project: ${data.title}  (${filesSummary(newFiles - filesBefore)})`,
      )
    } catch (err) {
      failed++
      console.error(`  error  Project ${slug}: ${describeError(err)}`)
    }
  }
}

/*
 * The pages
 */

/** theme.config.js: the site's name and SEO defaults, menu and social links */
async function siteSettings(): Promise<Result | undefined> {
  const source = await readFile(path.join(websiteDir, 'theme.config.js'), 'utf8')
  // Commented-out menu items aren't on the website
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const meta = code.match(/export const siteMetaData = \{([\s\S]*?)\n\}/)?.[1] ?? ''

  const menu = objectsIn(arrayIn(code, 'menu')).map((item) => {
    const icon = identifierIn(item, 'Icon')
    const label = stringIn(item, 'name')

    if (!icon || !MENU_ICONS[icon]) {
      notes.push(`Site settings: the menu item "${label}" got the Note icon; pick the right one.`)
    }

    return { icon: (icon && MENU_ICONS[icon]) || 'note', label, link: stringIn(item, 'slug') }
  })

  const social = objectsIn(arrayIn(code, 'social')).map((item) => {
    const icon = identifierIn(item, 'Icon')
    return { platform: (icon && SOCIAL_ICONS[icon]) || 'website', url: stringIn(item, 'url') }
  })

  const siteName = stringIn(meta, 'siteName')

  if (!siteName) {
    return undefined
  }

  return {
    data: {
      authorName: stringIn(meta, 'authorName'),
      defaultTitle: stringIn(meta, 'defaultTitle') || siteName,
      description: stringIn(meta, 'description'),
      email: stringIn(meta, 'email'),
      menu,
      siteName,
      social,
      titleTemplate: stringIn(meta, 'titleTemplate'),
      twitterHandle: /^@\w{1,15}$/.test(stringIn(meta, 'handle') ?? '')
        ? stringIn(meta, 'handle')
        : undefined,
    },
    summary: `${menu.length} menu items, ${social.length} social links`,
  }
}

/** content/index.md */
async function homePage(): Promise<Result | undefined> {
  const page = await readPage('index.md')
  if (!page) return undefined

  const where = 'content/index.md'
  const filesBefore = newFiles
  const main = sectionOf(page, 'main')
  const articles = sectionOf(page, 'articles')
  const companies = sectionOf(page, 'companies')
  let text = main.content

  const name = text.match(/^#\s+(.+)$/m)?.[1]
  text = text.replace(/^#\s+.+$/m, '')

  const roles = [...text.matchAll(/<Typewriter>([\s\S]*?)<\/Typewriter>/g)].map(([, role]) =>
    plainText(role!),
  )
  text = text.replace(/^.*<Typewriter>[\s\S]*?<\/Typewriter>.*$/gm, '')

  const location = text.match(/^#{5}\s+(.+)$/m)?.[1]
  text = text.replace(/^#{5}\s+.+$/m, '')

  // The Home layout shows the second image (other home layouts show the first on wide screens)
  const photo = toArray(main.data.images)[1] ?? toArray(main.data.images)[0]
  const featured = titleAndText(articles.content)
  const { button } = extractButton(sectionOf(page, 'cta').content)

  return {
    data: {
      achievements: toArray(sectionOf(page, 'achievements').data).map(({ number, text }) => ({
        number: String(number),
        text: String(text),
      })),
      button: await toButton(button, where),
      expertise: {
        logos: await Promise.all(
          toArray(companies.data.list)
            .filter((company) => company.icon?.src)
            .map(async (company) => ({
              logo: await upload(company.icon.src, company.name, where),
              name: company.name,
            })),
        ),
        title: companies.data.title,
      },
      featuredPosts: {
        limit: Number(articles.data.collection?.limit) || 6,
        text: featured.text,
        title: featured.title,
      },
      intro: await toRichText(text, where),
      location: location && plainText(location),
      name: name ? plainText(name) : undefined,
      photo: photo?.src ? await upload(photo.src, photo.alt, where) : undefined,
      roles,
      seo: seoOf(page.data),
    },
    summary: filesSummary(newFiles - filesBefore),
  }
}

/** content/about.md */
async function aboutPage(): Promise<Result | undefined> {
  const page = await readPage('about.md')
  if (!page) return undefined

  const where = 'content/about.md'
  const filesBefore = newFiles
  const info = sectionOf(page, 'personal_info')
  const photo = toArray(info.data.images)[0]
  const cta = extractButton(sectionOf(page, 'cta').content)
  const ctaTitle = cta.text.match(/^#{1,6}\s+(.+)$/m)?.[1]
  const specialties = sectionOf(page, 'skills_header').data

  // "##### <span>01.</span> About me" and its text, for each section
  const sections = await Promise.all(
    info.content
      .split(/^(?=#{5}\s)/m)
      .filter((part) => /^#{5}\s/.test(part))
      .map(async (part) => {
        const [heading, ...lines] = part.split('\n')
        return {
          text: await toRichText(lines.join('\n'), where),
          title: plainText(heading!).replace(/^\d+\.\s*/, ''),
        }
      }),
  )

  return {
    data: {
      cta: {
        button: await toButton(cta.button, where),
        text: plainParagraphs(cta.text.replace(/^#{1,6}\s+.+$/m, '')),
        title: ctaTitle && plainText(ctaTitle),
      },
      history: sectionsOf(page, 'history').map(({ data }) => ({
        entries: toArray(data.list).map(({ name, description, date }) => ({
          description: textOf(description),
          name: textOf(name),
          period: textOf(date),
        })),
        title: data.title,
      })),
      name: info.data.name,
      photo: photo?.src ? await upload(photo.src, photo.alt || info.data.name, where) : undefined,
      sections,
      seo: seoOf(page.data),
      skillSets: await Promise.all(
        sectionsOf(page, 'skills').map(async ({ data }) => ({
          skills: await Promise.all(
            toArray(data.list).map(async (skill) => ({
              icon: skill.icon?.src ? await upload(skill.icon.src, skill.title, where) : undefined,
              level: Number(skill.level),
              name: String(skill.title),
            })),
          ),
          title: data.title,
        })),
      ),
      specialties: { lines: toArray(specialties.list).map(String), title: specialties.title },
    },
    summary: filesSummary(newFiles - filesBefore),
  }
}

/** content/services.md */
async function servicesPage(): Promise<Result | undefined> {
  const page = await readPage('services.md')
  if (!page) return undefined

  const where = 'content/services.md'
  const filesBefore = newFiles
  const heading = extractPageTitle(sectionOf(page, 'main').content)
  const { button, text } = extractButton(heading.text)

  return {
    data: {
      button: await toButton(button, where),
      intro: await toRichText(text, where),
      seo: seoOf(page.data),
      services: await Promise.all(
        sectionsOf(page, 'services').map(async ({ content, data }) => ({
          icon: data.icon?.src ? await upload(data.icon.src, data.title, where) : undefined,
          text: await toRichText(content, where),
          title: data.title,
        })),
      ),
      subtitle: heading.subtitle,
      title: heading.title,
    },
    summary: filesSummary(newFiles - filesBefore),
  }
}

/** content/projects.md (the projects themselves come from content/projects) */
async function projectsPage(): Promise<Result | undefined> {
  const page = await readPage('projects.md')
  if (!page) return undefined

  const github = sectionOf(page, 'github')
  const projects = sectionOf(page, 'projects')
  const githubTitle = extractPageTitle(github.content)
  const projectsTitle = extractPageTitle(projects.content)

  return {
    data: {
      github: {
        repositories: toArray(github.data.repositories).map(String),
        text: plainParagraphs(githubTitle.text),
        title: githubTitle.title,
      },
      projects: {
        text: plainParagraphs(projectsTitle.text),
        title: projectsTitle.title,
      },
      seo: seoOf(page.data),
    },
    summary: `${toArray(github.data.repositories).length} GitHub repositories`,
  }
}

/** content/blog.md (the posts come from content/blog and Posts) */
async function blogPage(): Promise<Result | undefined> {
  const page = await readPage('blog.md')
  if (!page) return undefined

  return {
    data: {
      categories: titleAndText(sectionOf(page, 'categories').content),
      seo: seoOf(page.data),
      ...titleAndText(page.content),
    },
  }
}

/** content/contact.md (the form's questions stay in content/contact-form.json) */
async function contactPage(): Promise<Result | undefined> {
  const page = await readPage('contact.md')
  if (!page) return undefined

  const heading = extractPageTitle(sectionOf(page, 'main').content)
  // The lines with an <Icon> are the contact details
  const detailsBlock =
    heading.text.match(/<small>(?:(?!<\/small>)[\s\S])*<Icon\b[\s\S]*?<\/small>/)?.[0] ?? ''
  const details = detailsBlock
    .split('\n')
    .map((line) => line.match(/<Icon\s[^>]*?src=["']([^"']+)["'][^>]*\/>\s*(.*)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map(([, icon, text]) => {
      const type = CONTACT_ICONS[path.basename(icon!, '.svg')] ?? 'other'
      const [, label, value] = text!.match(/^([^:[]+):\s*(.*)$/) ?? [undefined, undefined, text]
      const link = value!.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)

      return {
        label: label?.trim(),
        link: link?.[2],
        type,
        value: (link?.[1] ?? plainText(value!)).trim(),
      }
    })

  return {
    data: {
      details,
      intro: await toRichText(heading.text.replace(detailsBlock, ''), 'content/contact.md'),
      seo: seoOf(page.data),
      subtitle: heading.subtitle,
      title: heading.title,
    },
    summary: `${details.length} contact details`,
  }
}

/*
 * Reading the website's files
 */

/** Reads a file of content/ like the website does (lib/mdx-parser.js) */
async function readPage(file: string): Promise<MarkdownPage | undefined> {
  const filePath = path.join(websiteDir, 'content', file)

  if (!existsSync(filePath)) {
    return undefined
  }

  const parsed = matter(await readFile(filePath, 'utf8'), {
    section: (section: { content: string; data: unknown }) => {
      if (typeof section.data === 'string' && section.data.trim() !== '') {
        section.data = yaml.load(section.data)
      }
      section.content = section.content.trim()
    },
  } as never) as unknown as {
    content: string
    data: Data
    sections?: { content: string; data: unknown; key: string }[]
  }

  const sections: MarkdownPage['sections'] = {}

  for (const { content, data, key } of parsed.sections ?? []) {
    const section = { content, data: (data && typeof data === 'object' ? data : {}) as Data }
    // "skills[1]" is the second item of "skills"
    const [, arrayKey, index] = key.match(/(\w+)\[([0-9]+)\]$/) ?? []

    if (arrayKey) {
      const list = (sections[arrayKey] ??= []) as Section[]
      list[Number(index)] = section
    } else {
      sections[key] = section
    }
  }

  return { content: parsed.content.trim(), data: parsed.data, sections }
}

function sectionOf(page: MarkdownPage, key: string): Section {
  const section = page.sections[key]
  return section && !Array.isArray(section) ? section : { content: '', data: {} }
}

function sectionsOf(page: MarkdownPage, key: string): Section[] {
  const sections = page.sections[key]
  return Array.isArray(sections) ? sections.filter(Boolean) : []
}

/** A YAML value as text; YAML reads e.g. 2023-01-01 as a date */
function textOf(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return value === null || value === undefined || value === '' ? undefined : String(value)
}

function toArray(value: unknown): Data[] {
  return Array.isArray(value) ? value.filter((item) => item !== null && item !== undefined) : []
}

function seoOf(data: Data) {
  const { description, title } = (data.seo ?? {}) as Data
  return { description: description || undefined, title: title || undefined }
}

/** Noon UTC on that day, like the admin panel saves a date without a time */
function toDay(date: unknown) {
  const day = date instanceof Date ? date.toISOString() : String(date ?? '')
  return /^\d{4}-\d{2}-\d{2}/.test(day)
    ? `${day.slice(0, 10)}T12:00:00.000Z`
    : new Date().toISOString()
}

/** `menu` in `export const menu = [ ... ]` */
function arrayIn(code: string, name: string) {
  return code.match(new RegExp(`export const ${name} = (\\[[\\s\\S]*?\\n\\])`))?.[1] ?? ''
}

/** The `{ ... }` objects of an array literal, without nested objects */
function objectsIn(arrayLiteral: string) {
  return [...arrayLiteral.matchAll(/\{([^{}]*)\}/g)].map(([, body]) => body!)
}

/** The string value of `key: '...'` */
function stringIn(code: string, key: string) {
  return code.match(new RegExp(`\\b${key}:\\s*(['"\`])(.*?)\\1`))?.[2] || undefined
}

/** The identifier in `key: Identifier` */
function identifierIn(code: string, key: string) {
  return code.match(new RegExp(`\\b${key}:\\s*([A-Za-z_$][\\w$]*)`))?.[1]
}

/*
 * From MDX to the CMS's fields
 */

/** Text without Markdown and tags: "### _My Expertise_" → "My Expertise" */
function plainText(markdown: string) {
  return markdown
    .replace(/^#+\s*/, '')
    .replace(/<[^>]+>/g, '')
    .replace(/(\*{1,2}|_{1,2})(\S(?:.*?\S)?)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Paragraphs of plain text, separated by blank lines */
function plainParagraphs(markdown: string) {
  const paragraphs = markdown
    .replace(/<Sep\b[^>]*\/>/g, '')
    .split(/\n\s*\n/)
    .map(plainText)
    .filter(Boolean)

  return paragraphs.length ? paragraphs.join('\n\n') : undefined
}

/** A heading and the paragraphs below it, e.g. "### Latest Articles" and its text */
function titleAndText(markdown: string) {
  const heading = markdown.match(/^#{1,6}\s+(.+)$/m)?.[1]
  return {
    text: plainParagraphs(markdown.replace(/^#{1,6}\s+.+$/m, '')),
    title: heading ? plainText(heading) : undefined,
  }
}

/** <PageTitle> ### Services ### _My Expertise_ </PageTitle> and the text after it */
function extractPageTitle(markdown: string) {
  const match = markdown.match(/<PageTitle>([\s\S]*?)<\/PageTitle>/)
  const headings = [...(match?.[1] ?? '').matchAll(/^\s*#{1,6}\s+(.+)$/gm)].map(([, heading]) =>
    plainText(heading!),
  )

  return {
    subtitle: headings[1],
    text: match ? markdown.replace(match[0], '') : markdown,
    title: headings[0],
  }
}

/** <Button href="/contact" size="sm">Contact Me</Button> and the text without it */
function extractButton(markdown: string) {
  const match = markdown.match(/<Button\b([^>]*)>([\s\S]*?)<\/Button>/)
  const href = match?.[1]?.match(/\bhref=(?:"([^"]*)"|'([^']*)')/)

  return {
    button: match ? { label: plainText(match[2]!), link: href?.[1] ?? href?.[2] } : undefined,
    text: match ? markdown.replace(match[0], '') : markdown,
  }
}

/** A button's link, or the file it links to when that file is in public/ (e.g. a resume) */
async function toButton(button: { label: string; link?: string } | undefined, where: string) {
  if (!button) return undefined

  const isFile = button.link?.startsWith('/') && /\.\w{2,4}$/.test(button.link)

  return isFile
    ? { file: await upload(button.link!, button.label, where), label: button.label }
    : { label: button.label, link: button.link }
}

/**
 * Markdown (with the website's MDX components) as rich text. Images on a line of their own become
 * uploads, <Youtube> a YouTube block; layout components such as <Sep> and <small> are left out.
 */
async function toRichText(mdx: string, where: string) {
  const markdown = mdx
    .replace(/^\[\/\/\]: # \(.*\)$/gm, '')
    .replace(/(^#{1,6}\s.*\n\s*)?<Newsletter\b[^>]*\/>/gm, '')
    .replace(/<Sep\b[^>]*\/>/g, '')
    .replace(/<\/?(?:small|span|div)\b[^>]*>/g, '')
    .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/g, '_$1_')
    .replace(/<(ol|ul)>([\s\S]*?)<\/\1>/g, (_, list: string, items: string) =>
      [...items.matchAll(/<li>([\s\S]*?)<\/li>/g)]
        .map(([, item], index) => `${list === 'ol' ? `${index + 1}.` : '-'} ${item!.trim()}`)
        .join('\n'),
    )
    // Indented lines inside JSX would otherwise become code blocks
    .replace(/^[ \t]+(?=\S)/gm, '')
    // A single trailing space means nothing (two are a line break)
    .replace(/(\S)[ \t]$/gm, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!markdown) return undefined

  const children: Data[] = []
  const special = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)[ \t]*$|<Youtube\b([\s\S]*?)\/>/gm
  let position = 0

  for (const match of markdown.matchAll(special)) {
    children.push(...markdownNodes(markdown.slice(position, match.index)))
    position = match.index! + match[0].length

    if (match[2]) {
      const value = await upload(match[2], match[1] ?? '', where)

      if (value) {
        children.push({
          type: 'upload',
          fields: {},
          format: '',
          id: newID(),
          relationTo: 'media',
          value,
          version: 3,
        })
      }
    } else {
      const id = match[3]?.match(/\bid=["']([^"']+)["']/)?.[1]
      const title = match[3]?.match(/\btitle=["']([^"']+)["']/)?.[1]

      if (id) {
        children.push({
          type: 'block',
          fields: {
            id: newID(),
            blockName: '',
            blockType: 'youtube',
            title,
            url: `https://www.youtube.com/watch?v=${id}`,
          },
          format: '',
          version: 2,
        })
      }
    }
  }

  children.push(...markdownNodes(markdown.slice(position)))

  const unsupported = JSON.stringify(children).match(/<[A-Z]\w*/g)

  if (unsupported) {
    notes.push(
      `${where}: ${[...new Set(unsupported)].join('>, ')}> can't be shown by the CMS and is left as text.`,
    )
  }

  return {
    root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 },
  }
}

function markdownNodes(markdown: string): Data[] {
  return markdown.trim()
    ? (convertMarkdownToLexical({
        editorConfig: editorConfig as SanitizedServerEditorConfig,
        markdown,
      }).root.children as Data[])
    : []
}

/** The ID of a node in rich text, like the editor creates them */
function newID() {
  return randomBytes(12).toString('hex')
}

/*
 * Images and icons
 */

/** Media IDs of images from the frontmatter, in order */
async function uploadAll(images: Data[], where: string) {
  const ids = await Promise.all(images.map((image) => upload(image.src, image.alt, where)))
  return ids.filter(Boolean)
}

/**
 * Saves a file from public/ (e.g. /icons/php.svg) in Media and returns its ID. A file with the
 * same name and size that is already in Media (e.g. from an earlier import) is used instead. In a
 * dry run nothing is saved.
 */
function upload(publicPath: string, alt: string | undefined, where: string) {
  if (!uploads.has(publicPath)) {
    const saved = lastUpload.then(() => saveFile(publicPath, alt, where))
    lastUpload = saved.catch(() => undefined)
    uploads.set(publicPath, saved)
  }

  return uploads.get(publicPath)!
}

async function saveFile(publicPath: string, alt: string | undefined, where: string) {
  const filePath = path.join(publicDir, publicPath)
  let id: string | undefined

  if (!filePath.startsWith(publicDir + path.sep) || !existsSync(filePath)) {
    notes.push(`${where}: ${publicPath} isn't in public/, so it was left out.`)
  } else {
    const { size } = await stat(filePath)
    const { docs } = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      // The image transformer can re-encode the file and keeps the uploaded one as `original`
      where: {
        and: [
          { filename: { contains: path.basename(filePath, path.extname(filePath)) } },
          { or: [{ filesize: { equals: size } }, { 'original.filesize': { equals: size } }] },
        ],
      },
    })

    if (docs[0]) {
      id = String(docs[0].id)
    } else {
      newFiles++

      if (!dryRun) {
        try {
          const media = await payload.create({
            collection: 'media',
            context,
            data: { alt: alt?.trim() || path.basename(filePath, path.extname(filePath)) },
            filePath,
            overrideAccess: true,
          })

          id = String(media.id)
        } catch (err) {
          newFiles--
          notes.push(`${where}: ${publicPath} could not be saved in Media: ${describeError(err)}`)
        }
      }
    }
  }

  return id
}

function filesSummary(count: number) {
  return `${count} new file${count === 1 ? '' : 's'} in Media`
}

function describeError(err: unknown) {
  const data = (err as { data?: { errors?: { message: string; path: string }[] } }).data
  const details = data?.errors?.map(({ message, path }) => `${path}: ${message}`).join('; ')

  return details || (err instanceof Error ? err.message : String(err))
}
