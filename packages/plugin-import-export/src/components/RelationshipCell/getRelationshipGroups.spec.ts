import type { ClientCollectionConfig } from 'payload'

import { describe, expect, it } from 'vitest'

import { getRelationshipGroups } from './getRelationshipGroups.js'

const collections = [
  {
    slug: 'posts',
    admin: { useAsTitle: 'title' },
    fields: [{ name: 'title', type: 'text' }],
    labels: { plural: 'Posts', singular: 'Post' },
  },
  {
    slug: 'users',
    admin: { useAsTitle: 'email' },
    fields: [{ name: 'email', type: 'email' }],
    labels: { plural: 'Users', singular: 'User' },
  },
] as unknown as ClientCollectionConfig[]

const i18n = { t: (key: string) => key } as any

const group = ({ relationTo, value }: { relationTo: string | string[]; value: unknown }) =>
  getRelationshipGroups({ collections, dateFormat: 'MMMM do yyyy', i18n, relationTo, value })

/** Collapses each group to `Label: value, value (+N)` so assertions stay readable. */
const summarize = (groups: ReturnType<typeof group>) =>
  groups.map(({ label, options, remaining }) => {
    const values = options.join(', ')

    return remaining ? `${label}: ${values} (+${remaining})` : `${label}: ${values}`
  })

describe('getRelationshipGroups', () => {
  describe('monomorphic', () => {
    it('should build a single group labeled with the plural collection label', () => {
      expect(group({ relationTo: 'posts', value: 3 })).toEqual([
        {
          label: 'Posts',
          options: ['3'],
          remaining: 0,
        },
      ])
    })

    it('should collect a list of bare IDs into one group', () => {
      expect(summarize(group({ relationTo: 'posts', value: [1, 2] }))).toEqual(['Posts: 1, 2'])
    })

    it('should title a populated document using useAsTitle', () => {
      expect(
        summarize(group({ relationTo: 'posts', value: { id: 3, title: 'The Wall' } })),
      ).toEqual(['Posts: The Wall'])
    })

    it('should fall back to untitled and ID for a document with no useAsTitle value', () => {
      expect(summarize(group({ relationTo: 'posts', value: { id: 3 } }))).toEqual([
        'Posts: general:untitled - ID: 3',
      ])
    })
  })

  describe('polymorphic', () => {
    it('should label a wrapped ID with its collection', () => {
      expect(
        summarize(
          group({ relationTo: ['posts', 'users'], value: { relationTo: 'posts', value: 3 } }),
        ),
      ).toEqual(['Posts: 3'])
    })

    it('should title a wrapped populated document using useAsTitle', () => {
      expect(
        summarize(
          group({
            relationTo: ['posts', 'users'],
            value: { relationTo: 'posts', value: { id: 3, title: 'The Wall' } },
          }),
        ),
      ).toEqual(['Posts: The Wall'])
    })

    it('should group entries that share a collection', () => {
      expect(
        summarize(
          group({
            relationTo: ['posts', 'users'],
            value: [
              { relationTo: 'users', value: 7 },
              { relationTo: 'posts', value: 3 },
              { relationTo: 'users', value: 9 },
            ],
          }),
        ),
      ).toEqual(['Users: 7, 9', 'Posts: 3'])
    })

    it('should order groups by where their collection first appears', () => {
      expect(
        group({
          relationTo: ['posts', 'users'],
          value: [
            { relationTo: 'posts', value: 3 },
            { relationTo: 'users', value: 7 },
          ],
        }).map(({ label }) => label),
      ).toEqual(['Posts', 'Users'])
    })

    it('should fall back to the collection slug when the collection has no labels', () => {
      expect(
        summarize(group({ relationTo: ['pages'], value: { relationTo: 'pages', value: 4 } })),
      ).toEqual(['pages: 4'])
    })

    it('should keep entries whose collection is unknown in their own unlabeled group', () => {
      expect(
        summarize(
          group({
            relationTo: ['posts', 'users'],
            value: [{ relationTo: 'posts', value: 3 }, 4],
          }),
        ),
      ).toEqual(['Posts: 3', ': 4'])
    })
  })

  describe('capping', () => {
    it('should not report remaining options when the group fits', () => {
      expect(summarize(group({ relationTo: 'posts', value: [1, 2, 3] }))).toEqual([
        'Posts: 1, 2, 3',
      ])
    })

    it('should cap a group at three options and count the rest', () => {
      expect(summarize(group({ relationTo: 'posts', value: [1, 2, 3, 4, 5] }))).toEqual([
        'Posts: 1, 2, 3 (+2)',
      ])
    })

    it('should cap each collection independently rather than across the cell', () => {
      expect(
        summarize(
          group({
            relationTo: ['posts', 'users'],
            value: [
              { relationTo: 'users', value: 7 },
              { relationTo: 'posts', value: 3 },
              { relationTo: 'users', value: 9 },
              { relationTo: 'posts', value: 4 },
            ],
          }),
        ),
      ).toEqual(['Users: 7, 9', 'Posts: 3, 4'])
    })

    it('should count overflow per collection', () => {
      expect(
        summarize(
          group({
            relationTo: ['posts', 'users'],
            value: [
              ...[1, 2, 3, 4, 5].map((value) => ({ relationTo: 'posts', value })),
              ...[7, 8].map((value) => ({ relationTo: 'users', value })),
            ],
          }),
        ),
      ).toEqual(['Posts: 1, 2, 3 (+2)', 'Users: 7, 8'])
    })

    it('should not let a leading collection crowd out a later one', () => {
      expect(
        summarize(
          group({
            relationTo: ['posts', 'users'],
            value: [
              ...[1, 2, 3, 4].map((value) => ({ relationTo: 'posts', value })),
              { relationTo: 'users', value: 7 },
            ],
          }),
        ),
      ).toEqual(['Posts: 1, 2, 3 (+1)', 'Users: 7'])
    })
  })

  describe('unresolvable values', () => {
    it('should render an object carrying no ID as JSON rather than [object Object]', () => {
      expect(summarize(group({ relationTo: 'posts', value: { slug: 'no-id-here' } }))).toEqual([
        'Posts: {"slug":"no-id-here"}',
      ])
    })

    it('should never render [object Object] for a wrapped value', () => {
      const groups = group({
        relationTo: ['posts', 'users'],
        value: { relationTo: 'posts', value: { title: 'No ID' } },
      })

      expect(groups[0]?.options[0]).not.toContain('[object Object]')
    })
  })
})
