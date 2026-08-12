import type { FilterOptions } from 'payload'

export const parentFilterOptions: (breadcrumbsFieldSlug?: string) => FilterOptions =
  (breadcrumbsFieldSlug = 'breadcrumbs') =>
  async ({ id, relationTo, req }) => {
    if (id) {
      // Querying `not_in` directly against a hasMany/array relationship subfield (e.g.
      // `breadcrumbs.doc`) is unreliable on relational databases: the SQL adapters join
      // the breadcrumbs rows table and filter it per-row, so a document is excluded only
      // if ONE of its breadcrumb rows matches, rather than requiring ALL of them to not
      // match. That lets descendants slip through the exclusion (see #17658).
      //
      // Querying `equals`/`in` against the same path does not have this problem, since
      // "at least one row matches" is exactly the semantics we want there. So we first
      // resolve the set of descendant IDs with a positive lookup, then exclude them (and
      // the document itself) using a plain `not_in` on `id`, which is never joined and is
      // therefore safe on every database.
      const { docs: descendants } = await req.payload.find({
        collection: relationTo,
        depth: 0,
        limit: 0,
        overrideAccess: false,
        pagination: false,
        req,
        select: {},
        user: req.user,
        where: {
          [`${breadcrumbsFieldSlug}.doc`]: { equals: id },
        },
      })

      return {
        id: { not_in: [id, ...descendants.map((doc) => doc.id)] },
      }
    }

    return true
  }
