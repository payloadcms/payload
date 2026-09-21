import type { CollectionConfig } from 'payload'

import { accessJoinArticlesSlug, accessJoinParentsSlug } from '../shared.js'

export const AccessJoinArticles: CollectionConfig = {
  slug: accessJoinArticlesSlug,
  access: {
    read: ({ req }) => {
      if (req.context.useNearAccessConstraint) {
        return { coordinates: { near: [0, 0, 1000] } }
      }

      if (req.context.useMixedFieldShapeAccessConstraint) {
        return { mixedTags: { equals: 'available' } }
      }

      if (req.context.useNestedHasManyAccessConstraint) {
        return { 'details.tags': { exists: false } }
      }

      if (req.context.useNestedMixedFieldShapeAccessConstraint) {
        return { 'details.mixedTags': { equals: 'available' } }
      }

      if (req.context.useContainsAccessConstraint) {
        return { tags: { contains: 'available' } }
      }

      if (req.context.useMixedScalarFieldShapeAccessConstraint) {
        return { variantValue: { equals: 5 } }
      }

      if (req.context.useScalarSelectAccessConstraint) {
        return { variantSelect: { equals: 'available' } }
      }

      if (req.context.useLocalizedHasManyAccessConstraint) {
        return { localizedTags: { equals: 'available' } }
      }

      if (req.context.useArrayHasManyAccessConstraint) {
        return { 'items.tags': { exists: false } }
      }

      if (req.context.useNotEqualsAccessConstraint) {
        return { tags: { not_equals: 'unavailable' } }
      }

      if (req.context.useNotInAccessConstraint) {
        return { tags: { not_in: ['unavailable'] } }
      }

      if (req.context.useEmptyInAccessConstraint) {
        return { tags: { in: [] } }
      }

      if (req.context.useMultipleInAccessConstraint) {
        return {
          availability: { equals: 'available' },
          tags: { in: ['not-permitted', 'allowed-marker'] },
        }
      }

      if (req.context.useMissingHasManyAccessConstraint) {
        return { articleTags: { exists: false } }
      }

      if (req.context.useMissingGroupHasManyAccessConstraint) {
        return { 'details.articleTags': { exists: false } }
      }

      if (req.context.useMissingTabHasManyAccessConstraint) {
        return { 'articleMeta.articleTags': { exists: false } }
      }

      if (req.context.useMissingEverywhereAccessConstraint) {
        return { missingTags: { exists: false } }
      }

      if (req.context.useMissingGroupEverywhereAccessConstraint) {
        return { 'details.missingTags': { exists: false } }
      }

      if (req.context.useMissingTabEverywhereAccessConstraint) {
        return { 'articleMeta.missingTags': { exists: false } }
      }

      if (req.context.useFlattenedFieldCollisionAccessConstraint) {
        return { 'details.status': { equals: 'available' } }
      }

      if (req.context.useReverseFlattenedFieldCollisionAccessConstraint) {
        return true
      }

      if (req.context.useCombinedFlattenedFieldCollisionAccessConstraint) {
        return { 'details.status': { equals: 'available' } }
      }

      if (req.context.useIDAccessConstraint) {
        return { id: { equals: req.context.allowedChildID } }
      }

      if (req.context.useUndefinedInAccessConstraint) {
        return { id: { in: req.context.allowedChildIDs } }
      }

      if (req.context.useNumberLikeAccessConstraint) {
        return { score: { like: '5' } }
      }

      if (req.context.useNestedRelationshipAccessConstraint) {
        return { 'owner.email': { exists: false } }
      }

      if (req.context.useNestedJSONAccessConstraint) {
        return { 'settings.approved': { equals: true } }
      }

      if (req.context.useNestedJSONExistsAccessConstraint) {
        return { 'settings.approved': { exists: true } }
      }

      if (req.context.useAbsentJSONAccessConstraint) {
        return { 'extras.flag': { equals: 1 } }
      }

      if (req.context.useAbsentJSONExistsAccessConstraint) {
        return { 'extras.flag': { exists: false } }
      }

      if (req.context.useUnsupportedJSONOperatorAccessConstraint) {
        return { 'settings.approved': { not_equals: true } }
      }

      return {
        availability: { not_equals: 'missing' },
        tags: { equals: 'available' },
        title: { not_equals: 'restricted child' },
      }
    },
  },
  fields: [
    {
      name: 'parent',
      type: 'relationship',
      relationTo: accessJoinParentsSlug,
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'availability',
      type: 'text',
    },
    {
      name: 'score',
      type: 'number',
    },
    {
      name: 'coordinates',
      type: 'point',
    },
    {
      name: 'tags',
      type: 'select',
      hasMany: true,
      options: ['allowed-marker', 'available', 'not-permitted', 'unavailable'],
    },
    {
      name: 'mixedTags',
      type: 'select',
      hasMany: true,
      options: ['available', 'not-permitted'],
    },
    {
      name: 'variantValue',
      type: 'text',
    },
    {
      name: 'variantSelect',
      type: 'select',
      options: ['available', 'unavailable'],
    },
    {
      name: 'localizedTags',
      type: 'select',
      hasMany: true,
      localized: true,
      options: ['available', 'unavailable'],
    },
    {
      name: 'articleTags',
      type: 'select',
      hasMany: true,
      options: ['available', 'unavailable'],
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'settings',
      type: 'json',
    },
    {
      name: 'extras',
      type: 'json',
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'tags',
          type: 'select',
          hasMany: true,
          options: ['available', 'unavailable'],
        },
      ],
    },
    {
      name: 'details',
      type: 'group',
      fields: [
        {
          name: 'articleTags',
          type: 'select',
          hasMany: true,
          options: ['available', 'unavailable'],
        },
        {
          name: 'status',
          type: 'text',
        },
        {
          name: 'tags',
          type: 'select',
          hasMany: true,
          options: ['available', 'not-permitted'],
        },
        {
          name: 'mixedTags',
          type: 'select',
          hasMany: true,
          options: ['available', 'not-permitted'],
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'articleMeta',
          fields: [
            {
              name: 'articleTags',
              type: 'select',
              hasMany: true,
              options: ['available', 'unavailable'],
            },
            {
              name: 'status',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
