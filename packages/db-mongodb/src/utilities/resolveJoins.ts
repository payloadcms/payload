import type { JoinQuery, SanitizedJoins } from 'payload'

import { fieldShouldBeLocalized } from 'payload/shared'

import type { MongooseAdapter } from '../index.js'

import { buildQuery } from '../queries/buildQuery.js'
import { buildSortParam } from '../queries/buildSortParam.js'
import { transform } from './transform.js'

type Args = {
  adapter: MongooseAdapter
  collectionSlug: string
  docs: Record<string, unknown>[]
  joins?: JoinQuery
  locale?: string
}

type SanitizedJoin = SanitizedJoins[string][number]

/**
 * Utility function to safely traverse nested object properties using dot notation
 * @param doc - The document to traverse
 * @param path - Dot-separated path (e.g., "user.profile.name")
 * @returns The value at the specified path, or undefined if not found
 */
function getByPath(doc: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((val, segment) => {
    if (val === undefined || val === null) {
      return undefined
    }
    return (val as Record<string, unknown>)[segment]
  }, doc)
}

/**
 * Enhanced utility function to safely traverse nested object properties using dot notation
 * Handles arrays by searching through array elements for matching values
 * @param doc - The document to traverse
 * @param path - Dot-separated path (e.g., "array.category")
 * @returns Array of values found at the specified path (for arrays) or single value
 */
function getByPathWithArrays(doc: unknown, path: string): unknown[] {
  const segments = path.split('.')
  let current = doc

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!

    if (current === undefined || current === null) {
      return []
    }

    // Get the value at the current segment
    const value = (current as Record<string, unknown>)[segment]

    if (value === undefined || value === null) {
      return []
    }

    // If this is the last segment, return the value(s)
    if (i === segments.length - 1) {
      return Array.isArray(value) ? value : [value]
    }

    // If the value is an array and we have more segments to traverse
    if (Array.isArray(value)) {
      const remainingPath = segments.slice(i + 1).join('.')
      const results: unknown[] = []

      // Search through each array element
      for (const item of value) {
        if (item && typeof item === 'object') {
          const subResults = getByPathWithArrays(item, remainingPath)
          results.push(...subResults)
        }
      }

      return results
    }

    // Continue traversing
    current = value
  }

  return []
}

/**
 * Resolves join relationships for a collection of documents.
 * This function fetches related documents based on join configurations and
 * attaches them to the original documents with pagination support.
 *
 * @param adapter - The MongoDB adapter instance
 * @param collectionSlug - The slug of the collection being queried
 * @param docs - Array of documents to resolve joins for
 * @param joins - Join query specifications (which joins to resolve and how)
 * @param locale - Optional locale for localized queries
 */
export async function resolveJoins({
  adapter,
  collectionSlug,
  docs,
  joins,
  locale,
}: Args): Promise<void> {
  // Early return if no joins are specified or no documents to process
  if (!joins || docs.length === 0) {
    return
  }

  // Get the collection configuration from the adapter
  const collectionConfig = adapter.payload.collections[collectionSlug]?.config
  if (!collectionConfig) {
    return
  }

  // Build a map of join paths to their configurations for quick lookup
  // This flattens the nested join structure into a single map keyed by join path
  const joinMap: Record<string, { targetCollection: string } & SanitizedJoin> = {}

  for (const [target, joinList] of Object.entries(collectionConfig.joins)) {
    for (const join of joinList || []) {
      joinMap[join.joinPath] = { ...join, targetCollection: target }
    }
  }

  // Process each requested join
  for (const [joinPath, joinQuery] of Object.entries(joins)) {
    if (!joinQuery) {
      continue
    }

    // Get the join definition from our map
    const joinDef = joinMap[joinPath]
    if (!joinDef) {
      continue
    }

    // Get the target collection configuration and Mongoose model
    const targetConfig = adapter.payload.collections[joinDef.field.collection as string]?.config
    const JoinModel = adapter.collections[joinDef.field.collection as string]
    if (!targetConfig || !JoinModel) {
      continue
    }

    // Extract all parent document IDs to use in the join query
    const parentIDs = docs.map((d) => d._id ?? d.id)

    // Build the base query for the target collection
    const whereQuery = await buildQuery({
      adapter,
      collectionSlug: joinDef.field.collection as string,
      fields: targetConfig.flattenedFields,
      locale,
      where: joinQuery.where || {},
    })

    // Use the provided locale or fall back to the default locale for localized fields
    const localizationConfig = adapter.payload.config.localization
    const effectiveLocale =
      locale ||
      (typeof localizationConfig === 'object' &&
        localizationConfig &&
        localizationConfig.defaultLocale)

    // Handle localized paths: transform 'localizedArray.category' to 'localizedArray.en.category'
    let dbFieldName = joinDef.field.on
    if (effectiveLocale && typeof localizationConfig === 'object' && localizationConfig) {
      const pathSegments = joinDef.field.on.split('.')
      const transformedSegments: string[] = []

      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i]!
        transformedSegments.push(segment)

        // Check if this segment corresponds to a localized field
        const fieldAtSegment = targetConfig.flattenedFields.find((f) => f.name === segment)
        if (fieldAtSegment && fieldAtSegment.localized) {
          transformedSegments.push(effectiveLocale)
        }
      }

      dbFieldName = transformedSegments.join('.')
    }

    // Check if the target field is a polymorphic relationship
    const isPolymorphic = Array.isArray(joinDef.targetField.relationTo)

    // Add the join condition: find documents where the join field matches any parent ID
    if (isPolymorphic) {
      // For polymorphic relationships, we need to match both relationTo and value
      whereQuery[`${dbFieldName}.relationTo`] = collectionSlug
      whereQuery[`${dbFieldName}.value`] = { $in: parentIDs }
    } else {
      // For regular relationships
      whereQuery[dbFieldName] = { $in: parentIDs }
    }

    // Build the sort parameters for the query
    const sort = buildSortParam({
      adapter,
      config: adapter.payload.config,
      fields: targetConfig.flattenedFields,
      locale,
      sort: joinQuery.sort || joinDef.field.defaultSort || targetConfig.defaultSort,
      timestamps: true,
    })

    // Convert sort object to Mongoose-compatible format
    // Mongoose expects -1 for descending and 1 for ascending
    const mongooseSort = Object.entries(sort).reduce(
      (acc, [key, value]) => {
        acc[key] = value === 'desc' ? -1 : 1
        return acc
      },
      {} as Record<string, -1 | 1>,
    )

    // Execute the query to get all related documents
    const results = await JoinModel.find(whereQuery, null).sort(mongooseSort).lean()

    // Transform the results to convert _id to id and handle other transformations
    transform({
      adapter,
      data: results,
      fields: targetConfig.fields,
      operation: 'read',
    })

    // Group the results by their parent document ID
    const grouped: Record<string, Record<string, unknown>[]> = {}

    for (const res of results) {
      // Get the parent ID(s) from the result using the join field
      let parents: unknown[]

      if (isPolymorphic) {
        // For polymorphic relationships, extract the value from the polymorphic structure
        const polymorphicField = getByPath(res, dbFieldName) as
          | { relationTo: string; value: unknown }
          | { relationTo: string; value: unknown }[]

        if (Array.isArray(polymorphicField)) {
          // Handle arrays of polymorphic relationships
          parents = polymorphicField
            .filter((item) => item && item.relationTo === collectionSlug)
            .map((item) => item.value)
        } else if (polymorphicField && polymorphicField.relationTo === collectionSlug) {
          // Handle single polymorphic relationship
          parents = [polymorphicField.value]
        } else {
          parents = []
        }
      } else {
        // For regular relationships, use the array-aware function to handle cases where the join field is within an array
        parents = getByPathWithArrays(res, dbFieldName)
      }

      for (const parent of parents) {
        if (!parent) {
          continue
        }
        const parentKey = parent as string
        if (!grouped[parentKey]) {
          grouped[parentKey] = []
        }
        grouped[parentKey].push(res)
      }
    }

    // Apply pagination settings
    const limit = joinQuery.limit ?? joinDef.field.defaultLimit ?? 10
    const page = joinQuery.page ?? 1

    // Determine if the join field should be localized
    const localeSuffix =
      fieldShouldBeLocalized({
        field: joinDef.field,
        parentIsLocalized: joinDef.parentIsLocalized,
      }) &&
      adapter.payload.config.localization &&
      effectiveLocale
        ? `.${effectiveLocale}`
        : ''

    // Adjust the join path with locale suffix if needed
    const localizedJoinPath = `${joinPath}${localeSuffix}`

    // Attach the joined data to each parent document
    for (const doc of docs) {
      const id = (doc._id ?? doc.id) as string
      const all = grouped[id] || []

      // Calculate the slice for pagination
      const slice = all.slice((page - 1) * limit, (page - 1) * limit + limit)

      // Create the join result object with pagination metadata
      const value: Record<string, unknown> = {
        docs: slice,
        hasNextPage: all.length > (page - 1) * limit + slice.length,
      }

      // Include total count if requested
      if (joinQuery.count) {
        value.totalDocs = all.length
      }

      // Navigate to the correct nested location in the document and set the join data
      // This handles nested join paths like "user.posts" by creating intermediate objects
      const segments = localizedJoinPath.split('.')
      let ref = doc
      for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i]!
        if (!ref[seg]) {
          ref[seg] = {}
        }
        ref = ref[seg] as Record<string, unknown>
      }
      // Set the final join data at the target path
      ref[segments[segments.length - 1]!] = value
    }
  }
}
