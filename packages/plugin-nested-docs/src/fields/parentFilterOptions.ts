import type { FilterOptions } from 'payload'

/**
 * Builds the default `filterOptions` for the nested-docs `parent` field.
 *
 * A document may not be its own parent, and it may not be parented to any of its own
 * descendants (that would create a cycle in the tree). Excluding descendants with a
 * `not_in` against the breadcrumbs relationship is unreliable on relational databases:
 * the SQL adapters join the breadcrumbs rows table and evaluate the filter per joined
 * row, so a document is excluded only when ONE of its rows matches instead of requiring
 * ALL of them to not match. Descendants therefore slip through the exclusion (see #17658).
 *
 * Instead, descendants are discovered by walking the real `parent` relationships
 * breadth-first, then excluded with a plain `not_in` on `id` - a column that is never
 * joined, and so behaves identically on every database adapter.
 *
 * The traversal runs with `overrideAccess: true` on purpose: this filter is structural,
 * not an access-control boundary. Descendants the current user cannot read must still be
 * excluded, otherwise a restricted user could select one and create a cycle.
 *
 * @param _breadcrumbsFieldSlug - retained for signature compatibility; descendants are no
 * longer resolved through breadcrumbs.
 */
export const parentFilterOptions: (
  breadcrumbsFieldSlug?: string,
  parentFieldSlug?: string,
) => FilterOptions =
  (_breadcrumbsFieldSlug = 'breadcrumbs', parentFieldSlug = 'parent') =>
  async ({ id, relationTo, req }) => {
    if (!id) {
      return true
    }

    const excludedIDs = new Set<number | string>([id])
    let frontier: (number | string)[] = [id]

    while (frontier.length > 0) {
      const { docs: children } = await req.payload.find({
        collection: relationTo,
        depth: 0,
        limit: 0,
        overrideAccess: true,
        pagination: false,
        req,
        select: {},
        where: {
          [parentFieldSlug]: { in: frontier },
        },
      })

      const nextFrontier: (number | string)[] = []

      for (const child of children) {
        if (!excludedIDs.has(child.id)) {
          excludedIDs.add(child.id)
          nextFrontier.push(child.id)
        }
      }

      frontier = nextFrontier
    }

    return {
      id: { not_in: [...excludedIDs] },
    }
  }
