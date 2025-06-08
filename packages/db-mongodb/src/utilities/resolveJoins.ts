import type { JoinQuery, SanitizedJoins } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { buildQuery } from '../queries/buildQuery.js'
import { buildSortParam } from '../queries/buildSortParam.js'

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

    // Add the join condition: find documents where the join field matches any parent ID
    whereQuery[joinDef.field.on] = { $in: parentIDs }

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

    // Group the results by their parent document ID
    const grouped: Record<string, Record<string, unknown>[]> = {}

    for (const res of results) {
      // Get the parent ID from the result using the join field
      const parent = getByPath(res, joinDef.field.on)
      if (!parent) {
        continue
      }
      const parentKey = parent as string
      if (!grouped[parentKey]) {
        grouped[parentKey] = []
      }
      grouped[parentKey].push(res)
    }

    // Apply pagination settings
    const limit = joinQuery.limit ?? joinDef.field.defaultLimit ?? 10
    const page = joinQuery.page ?? 1

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
      const segments = joinPath.split('.')
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
