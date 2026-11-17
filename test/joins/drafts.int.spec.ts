import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  draftJoinArticlesSlug,
  draftJoinNotesSlug,
  draftJoinProjectsSlug,
  draftJoinWorkspacesSlug,
} from './shared.js'

test.suite('Polymorphic join drafts', { config: './drafts.config.ts' }, () => {
  for (const useJoinAggregations of [true, false]) {
    test.options.describe(
      useJoinAggregations ? 'Default joins' : 'MongoDB fallback joins',
      { db: useJoinAggregations ? 'all' : 'mongo' },
      () => {
        test.beforeEach(({ payload }) => {
          if ('useJoinAggregations' in payload.db) {
            payload.db.useJoinAggregations = useJoinAggregations
          }
        })

        test.afterEach(({ payload }) => {
          if ('useJoinAggregations' in payload.db) {
            payload.db.useJoinAggregations = true
          }
        })

        test('should use the latest draft relationship when selecting joined documents', async ({
          payload,
        }) => {
          const originalProject = await payload.create({
            collection: draftJoinProjectsSlug,
            overrideAccess: true,
            data: { title: 'Original project', _status: 'published' },
          })
          const destinationProject = await payload.create({
            collection: draftJoinProjectsSlug,
            overrideAccess: true,
            data: { title: 'Destination project', _status: 'published' },
          })
          const article = await payload.create({
            collection: draftJoinArticlesSlug,
            overrideAccess: true,
            data: { title: 'Announcement', project: originalProject.id, _status: 'published' },
          })

          await payload.update({
            collection: draftJoinArticlesSlug,
            id: article.id,
            draft: true,
            overrideAccess: true,
            data: { project: destinationProject.id },
          })

          const result = await payload.findByID({
            collection: draftJoinProjectsSlug,
            id: destinationProject.id,
            depth: 0,
            draft: true,
            joins: { documents: { count: true, limit: 0 } },
          })

          expect(result).toMatchObject({
            documents: {
              docs: [{ relationTo: draftJoinArticlesSlug, value: article.id }],
              totalDocs: 1,
            },
          })
        })

        test('should keep published membership after a draft move', async ({ payload }) => {
          const project = await payload.create({
            collection: draftJoinProjectsSlug,
            overrideAccess: true,
            data: { title: 'Project', _status: 'published' },
          })
          const article = await payload.create({
            collection: draftJoinArticlesSlug,
            overrideAccess: true,
            data: { title: 'Published', project: project.id, _status: 'published' },
          })

          await payload.update({
            collection: draftJoinArticlesSlug,
            id: article.id,
            draft: true,
            overrideAccess: true,
            data: { project: null, title: 'Unassigned draft' },
          })

          const published = await payload.findByID({
            collection: draftJoinProjectsSlug,
            id: project.id,
            depth: 0,
            draft: false,
            joins: { documents: { count: true, limit: 0 } },
          })
          const draft = await payload.findByID({
            collection: draftJoinProjectsSlug,
            id: project.id,
            depth: 0,
            draft: true,
            joins: { documents: { count: true, limit: 0 } },
          })

          expect(published).toMatchObject({
            documents: {
              docs: [{ relationTo: draftJoinArticlesSlug, value: article.id }],
              totalDocs: 1,
            },
          })
          expect(draft).toMatchObject({ documents: { docs: [], totalDocs: 0 } })
        })

        test('should combine latest drafts with unversioned documents before filtering and paging', async ({
          payload,
        }) => {
          const project = await payload.create({
            collection: draftJoinProjectsSlug,
            overrideAccess: true,
            data: { title: 'Project', _status: 'published' },
          })
          const article = await payload.create({
            collection: draftJoinArticlesSlug,
            overrideAccess: true,
            data: { title: 'Old title', _status: 'published' },
          })

          for (const title of ['Included A', 'Included B']) {
            await payload.update({
              collection: draftJoinArticlesSlug,
              id: article.id,
              draft: true,
              overrideAccess: true,
              data: { project: project.id, title },
            })
          }

          const note = await payload.create({
            collection: draftJoinNotesSlug,
            overrideAccess: true,
            data: { title: 'Included C', project: project.id },
          })

          await payload.create({
            collection: draftJoinArticlesSlug,
            draft: true,
            overrideAccess: true,
            data: { title: 'Excluded', project: project.id },
          })

          for (const [index, expected] of [
            { relationTo: draftJoinArticlesSlug, value: article.id },
            { relationTo: draftJoinNotesSlug, value: note.id },
          ].entries()) {
            const result = await payload.find({
              collection: draftJoinProjectsSlug,
              where: { id: { equals: project.id } },
              depth: 0,
              draft: true,
              joins: {
                documents: {
                  count: true,
                  limit: 1,
                  page: index + 1,
                  sort: 'title',
                  where: { title: { contains: 'Included' } },
                },
              },
            })

            expect(result.docs[0]).toMatchObject({
              documents: { docs: [expected], totalDocs: 2 },
            })
          }
        })

        test('should populate newly created drafts with canonical document IDs', async ({
          payload,
        }) => {
          const project = await payload.create({
            collection: draftJoinProjectsSlug,
            overrideAccess: true,
            data: { title: 'Draft project' },
            draft: true,
          })
          const article = await payload.create({
            collection: draftJoinArticlesSlug,
            overrideAccess: true,
            data: { title: 'Draft article', project: project.id },
            draft: true,
          })
          const result = await payload.findByID({
            collection: draftJoinProjectsSlug,
            id: project.id,
            depth: 1,
            draft: true,
            joins: { documents: { count: true, limit: 0 } },
          })

          expect(result).toMatchObject({
            documents: {
              docs: [
                {
                  relationTo: draftJoinArticlesSlug,
                  value: { id: article.id, title: 'Draft article' },
                },
              ],
              totalDocs: 1,
            },
          })
        })

        test('should apply localized and has-many filters to the latest draft', async ({
          payload,
        }) => {
          const project = await payload.create({
            collection: draftJoinProjectsSlug,
            overrideAccess: true,
            data: { title: 'Project', _status: 'published' },
          })
          const article = await payload.create({
            collection: draftJoinArticlesSlug,
            overrideAccess: true,
            locale: 'fr',
            data: { title: 'Published title', tags: ['excluded'], _status: 'published' },
          })

          await payload.update({
            collection: draftJoinArticlesSlug,
            id: article.id,
            overrideAccess: true,
            draft: true,
            locale: 'fr',
            data: { title: 'Draft title', tags: ['included'], project: project.id },
          })

          const result = await payload.findByID({
            collection: draftJoinProjectsSlug,
            id: project.id,
            draft: true,
            depth: 0,
            locale: 'fr',
            joins: {
              documents: {
                count: true,
                limit: 0,
                where: {
                  and: [{ title: { equals: 'Draft title' } }, { tags: { equals: 'included' } }],
                },
              },
            },
          })

          expect(result).toMatchObject({
            documents: {
              docs: [{ relationTo: draftJoinArticlesSlug, value: article.id }],
              totalDocs: 1,
            },
          })
        })

        test('should read draft memberships when the parent collection has no drafts', async ({
          payload,
        }) => {
          const workspace = await payload.create({
            collection: draftJoinWorkspacesSlug,
            overrideAccess: true,
            data: { title: 'Workspace' },
          })
          const article = await payload.create({
            collection: draftJoinArticlesSlug,
            overrideAccess: true,
            data: { title: 'Published', _status: 'published' },
          })

          await payload.update({
            collection: draftJoinArticlesSlug,
            id: article.id,
            overrideAccess: true,
            draft: true,
            data: { workspace: workspace.id },
          })

          for (const method of ['find', 'findByID'] as const) {
            const options = {
              collection: draftJoinWorkspacesSlug,
              depth: 0,
              draft: true,
              joins: { documents: { count: true, limit: 0 } },
            }
            const result =
              method === 'find'
                ? (await payload.find({ ...options, where: { id: { equals: workspace.id } } }))
                    .docs[0]
                : await payload.findByID({ ...options, id: workspace.id })

            expect(result).toMatchObject({
              documents: {
                docs: [{ relationTo: draftJoinArticlesSlug, value: article.id }],
                totalDocs: 1,
              },
            })
          }
        })
      },
    )
  }
})
