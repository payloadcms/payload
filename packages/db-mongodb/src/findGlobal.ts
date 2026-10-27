import type { QueryOptions } from 'mongoose'
import type { FindGlobal, FindGlobalArgs } from 'payload'

import {
  branchGlobalNeedsBothRows,
  combineQueries,
  pickBranchGlobal,
  resolveBranch,
  resolveBranchGlobalQuery,
  withBranchGlobalSelect,
} from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const findGlobal: FindGlobal = async function findGlobal<T extends Record<string, unknown>>(
  this: MongooseAdapter,
  { slug: globalSlug, branch, locale, req, select, where = {} }: FindGlobalArgs,
) {
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug })

  const fields = globalConfig.flattenedFields

  const branchedWhere = resolveBranchGlobalQuery({ branch, globalSlug, req, where })

  const query = await buildQuery({
    adapter: this,
    branch,
    fields,
    globalSlug,
    locale,
    req,
    where: combineQueries({ globalType: { equals: globalSlug } }, branchedWhere ?? {}),
  })

  const options: QueryOptions = {
    lean: true,
    select: buildProjectionFromSelect({
      adapter: this,
      fields,
      select: withBranchGlobalSelect({ branch, globalSlug, req, select }),
    }),
    session: await getSession(this, req),
  }

  // A global is one document, so the branch's row and main's row can be fetched
  // together and the branch's preferred in memory. There is no result set to
  // paginate, so nothing a post-query step could get wrong.
  let doc: T | undefined

  if (branchGlobalNeedsBothRows({ branch, globalSlug, req })) {
    const rows = await Model.find(query, {}, { ...options, limit: 2 }).lean<T[]>()

    doc = pickBranchGlobal(rows, branch || resolveBranch(req as never))
  } else {
    doc = (await Model.findOne(query, {}, options).lean<T>()) as T
  }

  if (!doc) {
    return null as unknown as T
  }

  transform({
    adapter: this,
    data: doc,
    fields: globalConfig.fields,
    operation: 'read',
  })

  return doc
}
