import type { Block, Payload } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { hookSpy } from './hookSpy.js'
import {
  autosaveSlug,
  branchesSlug,
  categoriesSlug,
  excludedSlug,
  headerGlobalSlug,
  homepageGlobalSlug,
  localizedSlug,
  maxVersionsSlug,
  mediaSlug,
  nestedSlug,
  numericIDSlug,
  pagesSlug,
  postsSlug,
  publicSlug,
  restrictedSlug,
  uninitializedGlobalSlug,
  uniqueSlug,
  whereAccessSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const mergeRestrictedEditorEmail = 'editor@example.com'
export const localizedCategoryBlockSlug = 'localized-category-block'

const localizedCategoryBlock: Block = {
  slug: localizedCategoryBlockSlug,
  fields: [
    {
      name: 'category',
      type: 'relationship',
      localized: true,
      relationTo: categoriesSlug,
    },
  ],
}

const seedBranchingTestData = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    data: { email: devUser.email, password: devUser.password },
    overrideAccess: true,
  })

  // Seeded so the branch switcher in the admin panel has something to switch
  // between as soon as `pnpm dev branching` comes up.
  for (const branch of [
    { name: 'Halloween Updates', slug: 'halloween-updates' },
    { name: 'Q4 Campaign', slug: 'q4-campaign' },
    { name: 'Pricing Refresh', slug: 'pricing-refresh' },
  ]) {
    await payload.create({
      collection: branchesSlug,
      data: { ...branch, status: 'open' },
      overrideAccess: true,
    })
  }
}

export default buildConfigWithDefaults({
  config: {
    blocks: [localizedCategoryBlock],
    branching: {
      access: {
        createBranch: ({ req }) => req.payloadAPI === 'local' || Boolean(req.user),
        deleteBranch: ({ req }) =>
          req.payloadAPI === 'local' && !req.user ? true : req.user?.email === devUser.email,
        readBranch: ({ req }) => {
          if (req.payloadAPI === 'local' && !req.user) {
            return true
          }

          if (!req.user) {
            return false
          }

          return req.user.email === devUser.email
            ? true
            : { slug: { not_equals: 'private-visibility' } }
        },
      },
      hooks: {
        beforeMerge: (args) => hookSpy.beforeMerge?.(args),
      },
    },
    collections: [
      {
        slug: postsSlug,
        access: {
          read: ({ req }) =>
            hookSpy.restrictLedgerSnapshotEntityRead &&
            req.user?.email === 'ledger-reader@example.com'
              ? { order: { equals: 1 } }
              : true,
        },
        admin: { useAsTitle: 'title' },
        fields: [
          {
            name: 'title',
            type: 'text',
            access: {
              read: ({ req }) => req.user?.email !== 'ledger-reader@example.com',
            },
            hooks: {
              afterRead: [
                ({ value }) => {
                  if (hookSpy.postTitleAfterReadCount !== undefined) {
                    hookSpy.postTitleAfterReadCount += 1
                  }

                  return value
                },
              ],
            },
          },
          { name: 'order', type: 'number' },
          {
            name: 'confidential',
            type: 'text',
            access: { read: ({ req }) => req.user?.email === devUser.email },
          },
          {
            name: 'computedDefault',
            type: 'text',
            defaultValue: () => {
              if (hookSpy.postDefaultValueCount === undefined) {
                return undefined
              }

              hookSpy.postDefaultValueCount += 1

              return 'computed during read'
            },
            virtual: true,
          },
          { name: 'internalNote', type: 'text', hidden: true },
          { name: 'category', type: 'relationship', relationTo: categoriesSlug },
          {
            name: 'localizedCategory',
            type: 'relationship',
            localized: true,
            relationTo: categoriesSlug,
          },
          {
            name: 'sharedLayout',
            type: 'blocks',
            blocks: [localizedCategoryBlockSlug],
          },
        ],
        hooks: {
          afterChange: [(args) => hookSpy.afterChange?.(args)],
          afterDelete: [(args) => hookSpy.postAfterDelete?.(args)],
          beforeChange: [(args) => hookSpy.beforeChange?.(args)],
          beforeOperation: [(args) => hookSpy.postBeforeOperation?.(args)],
          beforeRead: [
            ({ doc }) => {
              hookSpy.postBeforeRead?.()

              return doc
            },
          ],
        },
        versions: false,
      },
      {
        slug: pagesSlug,
        access: {
          create: ({ data, req }) => {
            if (data?.title === 'create access where result') {
              return { id: { equals: 'no-existing-row-can-match' } }
            }

            const hasAccess =
              hookSpy.allowRestrictedCreate !== false ||
              req.user?.email !== mergeRestrictedEditorEmail

            hookSpy.restrictedCreateAccessResults?.push(hasAccess)

            return hasAccess
          },
          update: ({ data, req }) => {
            hookSpy.pageUpdateAccess?.()

            if (
              req.user?.email === mergeRestrictedEditorEmail &&
              data?.title === 'draft after allowed publish'
            ) {
              return { title: { equals: 'published before draft' } }
            }

            if (
              req.user?.email === mergeRestrictedEditorEmail &&
              data?.title === 'draft allowed only off main'
            ) {
              return { _branch: { not_equals: 'main' } }
            }

            return true
          },
        },
        admin: { useAsTitle: 'title' },
        fields: [
          { name: 'title', type: 'text' },
          { name: 'category', type: 'relationship', relationTo: categoriesSlug },
        ],
        hooks: {
          beforeChange: [() => hookSpy.pageBeforeChange?.()],
          beforeOperation: [(args) => hookSpy.pageBeforeOperation?.(args)],
        },
        versions: { drafts: true },
      },
      {
        slug: categoriesSlug,
        fields: [
          { name: 'name', type: 'text' },
          { name: 'pages', type: 'join', collection: pagesSlug, on: 'category' },
          { name: 'posts', type: 'join', collection: postsSlug, on: 'category' },
          {
            name: 'content',
            type: 'join',
            collection: [postsSlug, pagesSlug],
            on: 'category',
          },
        ],
        versions: false,
      },
      {
        slug: mediaSlug,
        fields: [{ name: 'alt', type: 'text' }],
        upload: {
          filenameCompoundIndex: ['filename', 'alt'],
          staticDir: path.resolve(dirname, 'media'),
        },
        versions: false,
      },
      {
        slug: uniqueSlug,
        fields: [
          { name: 'slug', type: 'text', unique: true },
          {
            name: 'metadata',
            type: 'group',
            fields: [{ name: 'code', type: 'text', unique: true }],
          },
          { name: 'site', type: 'text' },
          { name: 'customSlug', type: 'text' },
        ],
        indexes: [
          {
            fields: ['site', 'customSlug'],
            requireExists: ['site', 'customSlug'],
            unique: true,
          },
        ],
        versions: false,
      },
      {
        // Verifies `_branchDocID` inherits a non-default ID type.
        slug: numericIDSlug,
        fields: [
          { name: 'id', type: 'number', required: true },
          { name: 'title', type: 'text' },
        ],
        versions: false,
      },
      {
        // Access depends on who is asking, so merge must evaluate it as the
        // merging user against the exact data proposed by the branch.
        slug: restrictedSlug,
        access: {
          update: ({ data, req }) => {
            if (req.user?.email === mergeRestrictedEditorEmail) {
              return data?.title !== 'edited on branch'
            }

            return req.user?.email === devUser.email
          },
        },
        fields: [{ name: 'title', type: 'text' }],
        versions: false,
      },
      {
        // Where-returning access, to exercise tier 2 of the preflight.
        slug: whereAccessSlug,
        access: {
          update: () => ({ mergeable: { equals: true } }),
        },
        fields: [
          { name: 'title', type: 'text' },
          { name: 'mergeable', type: 'checkbox' },
        ],
        versions: false,
      },
      {
        // The canonical public-site rule. A branch's copy of a published document
        // satisfies it too, which is what the branch gate exists to stop.
        slug: publicSlug,
        access: { read: () => ({ _status: { equals: 'published' } }) },
        admin: { useAsTitle: 'title' },
        fields: [
          { name: 'title', type: 'text' },
          {
            name: '_status',
            type: 'select',
            access: {
              update: ({ req }) => req.user?.email !== mergeRestrictedEditorEmail,
            },
            options: [],
          },
        ],
        versions: { drafts: true },
      },
      {
        // Two versions kept, so pruning happens on the third save. Pruning on a branch
        // must never reach main's chain.
        slug: maxVersionsSlug,
        admin: { useAsTitle: 'title' },
        fields: [{ name: 'title', type: 'text' }],
        versions: { drafts: true, maxPerDoc: 2 },
      },
      {
        // Autosave is the path into `updateLatestVersion`, which rewrites a version row
        // in place rather than appending one.
        slug: autosaveSlug,
        admin: { useAsTitle: 'title' },
        fields: [{ name: 'title', type: 'text' }],
        versions: { drafts: { autosave: { interval: 0 } } },
      },
      {
        // Localized fields fork per locale, and `_status` localization is what reaches the
        // version writes that were not branch-aware.
        slug: localizedSlug,
        access: {
          create: ({ data, req }) => {
            hookSpy.localizedCreateAccessTitles?.push(data?.title)

            return (
              req.user?.email !== mergeRestrictedEditorEmail ||
              data?.title !== 'blocked localized create' ||
              hookSpy.allowRestrictedLocalizedCreate === true
            )
          },
          update: ({ data, req }) =>
            req.user?.email !== mergeRestrictedEditorEmail ||
            data?.title !== 'blocked localized proposed data',
        },
        admin: { useAsTitle: 'title' },
        fields: [
          { name: 'title', type: 'text', localized: true },
          {
            name: 'restrictedHidden',
            type: 'text',
            access: {
              create: ({ req, siblingData }) =>
                req.user?.email !== mergeRestrictedEditorEmail ||
                siblingData.restrictedHidden !== 'protected branch value',
            },
            hidden: true,
            localized: true,
          },
          {
            name: 'restrictedSelectedOut',
            type: 'text',
            access: {
              create: ({ req, siblingData }) =>
                req.user?.email !== mergeRestrictedEditorEmail ||
                siblingData.restrictedSelectedOut !== 'protected branch value',
            },
            localized: true,
          },
          {
            name: 'items',
            type: 'array',
            fields: [{ name: 'label', type: 'text', localized: true }],
          },
          {
            name: 'mergeGuardCategory',
            type: 'relationship',
            hooks: {
              beforeChange: [
                ({ siblingDocWithLocales, value }) => {
                  const targetID = hookSpy.mainMergeLocalizedCollectionDependencyTargetID

                  if (targetID === undefined || !siblingDocWithLocales) {
                    return value
                  }

                  const currentValue = siblingDocWithLocales.mergeGuardCategory

                  siblingDocWithLocales.mergeGuardCategory = {
                    ...(currentValue && typeof currentValue === 'object' ? currentValue : {}),
                    es: targetID,
                  }

                  return value
                },
              ],
            },
            localized: true,
            relationTo: categoriesSlug,
          },
          {
            name: 'computedDefault',
            type: 'text',
            defaultValue: () => {
              if (hookSpy.postDefaultValueCount === undefined) {
                return undefined
              }

              hookSpy.postDefaultValueCount += 1

              return 'computed during read'
            },
            virtual: true,
          },
          { name: 'shared', type: 'text' },
        ],
        hooks: {
          afterChange: [
            ({ doc, operation, req }) => {
              hookSpy.localizedChangeOperations?.push(operation)
              hookSpy.localizedChangeRows?.push({
                ids: doc.items?.map((item: { id?: number | string }) => item.id) ?? [],
                locale: req.locale,
              })
            },
          ],
        },
        select: () => (hookSpy.restrictLocalizedReadSelect ? { title: true } : undefined),
        versions: { drafts: true },
      },
      {
        // Arrays and blocks live in their own tables under Drizzle, so a fork has to copy
        // child rows and re-parent them — a path no flat-field test can reach.
        slug: nestedSlug,
        admin: { useAsTitle: 'title' },
        fields: [
          { name: 'title', type: 'text' },
          {
            name: 'items',
            type: 'array',
            fields: [
              {
                name: 'label',
                type: 'text',
                access: {
                  create: ({ req }) =>
                    hookSpy.allowRestrictedNestedFieldWrite === true ||
                    req.user?.email !== mergeRestrictedEditorEmail,
                  update: ({ req }) =>
                    hookSpy.allowRestrictedNestedFieldWrite === true ||
                    req.user?.email !== mergeRestrictedEditorEmail,
                },
              },
              { name: 'note', type: 'text' },
            ],
          },
          {
            name: 'layout',
            type: 'blocks',
            blocks: [
              {
                slug: 'hero',
                fields: [{ name: 'heading', type: 'text' }],
              },
            ],
          },
        ],
        versions: false,
      },
      {
        slug: excludedSlug,
        branching: false,
        fields: [{ name: 'title', type: 'text' }],
        versions: false,
      },
    ],
    globals: [
      {
        slug: headerGlobalSlug,
        access: {
          read: ({ req }) =>
            hookSpy.restrictLedgerSnapshotGlobalRead &&
            req.user?.email === 'ledger-reader@example.com'
              ? { navLabel: { equals: 'main label' } }
              : true,
          update: ({ data, req }) => {
            if (req.user?.email !== mergeRestrictedEditorEmail) {
              return true
            }

            if (data?.navLabel === 'blocked by proposed data') {
              return false
            }

            return { navLabel: { equals: 'global main allowed' } }
          },
        },
        fields: [
          { name: 'navLabel', type: 'text' },
          { name: 'secondaryLabel', type: 'text' },
          {
            name: 'navItems',
            type: 'array',
            fields: [{ name: 'label', type: 'text' }],
          },
          {
            name: 'navigationBlocks',
            type: 'blocks',
            blocks: [
              {
                slug: 'navigation-block',
                fields: [{ name: 'label', type: 'text' }],
              },
            ],
          },
        ],
        hooks: {
          beforeOperation: [() => hookSpy.headerBeforeOperation?.()],
          beforeRead: [
            ({ doc }) => {
              hookSpy.postBeforeRead?.()

              return doc
            },
          ],
        },
        versions: false,
      },
      {
        slug: homepageGlobalSlug,
        access: {
          update: ({ data, req }) => {
            hookSpy.homepageGlobalAccessWrites?.push({
              heroTitle: data?.heroTitle,
              locale: req.locale,
              localizedTitle: data?.localizedTitle,
            })

            if (data?.heroTitle === 'draft allowed only off main') {
              return { _branch: { not_equals: 'main' } }
            }

            if (data?.heroTitle === 'requires unlocked global') {
              return { heroTitle: { equals: 'unlocked global' } }
            }

            if (data?.localizedTitle === 'blocked Spanish draft' && req.locale === 'es') {
              return false
            }

            return true
          },
        },
        fields: [
          { name: 'heroTitle', type: 'text' },
          { name: 'localizedTitle', type: 'text', localized: true },
          {
            name: 'mergeGuardCategory',
            type: 'relationship',
            hooks: {
              beforeChange: [
                ({ siblingDocWithLocales, value }) => {
                  const targetID = hookSpy.mainMergeLocalizedGlobalDependencyTargetID

                  if (targetID === undefined || !siblingDocWithLocales) {
                    return value
                  }

                  const currentValue = siblingDocWithLocales.mergeGuardCategory

                  siblingDocWithLocales.mergeGuardCategory = {
                    ...(currentValue && typeof currentValue === 'object' ? currentValue : {}),
                    es: targetID,
                  }

                  return value
                },
              ],
            },
            localized: true,
            relationTo: categoriesSlug,
          },
        ],
        hooks: {
          beforeChange: [
            ({ originalDoc }) => {
              hookSpy.mainMergeGlobalOriginalHeroTitles?.push(originalDoc.heroTitle)
            },
          ],
        },
        versions: { drafts: true },
      },
      {
        slug: uninitializedGlobalSlug,
        fields: [{ name: 'branchValue', type: 'text' }],
        versions: false,
      },
    ],
    localization: {
      defaultLocale: 'en',
      fallback: true,
      locales: ['en', 'es'],
    },
    onInit: seedBranchingTestData,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: seedBranchingTestData,
  suite: 'branching',
})
