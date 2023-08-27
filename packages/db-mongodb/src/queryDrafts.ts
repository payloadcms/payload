import type { PaginateOptions } from 'mongoose';
import type { QueryDrafts } from 'payload/dist/database/types';
import flattenWhereToOperators from 'payload/dist/database/flattenWhereToOperators';
import { PayloadRequest } from 'payload/dist/express/types';
import { combineQueries } from 'payload/dist/database/combineQueries';
import sanitizeInternalFields from './utilities/sanitizeInternalFields';
import type { MongooseAdapter } from '.';
import { buildSortParam } from './queries/buildSortParam';
import { withSession } from './withSession';

export const queryDrafts: QueryDrafts = async function queryDrafts(
  this: MongooseAdapter,
  {
    collection,
    where,
    page,
    limit,
    sort: sortArg,
    locale,
    pagination,
    req = {} as PayloadRequest,
  },
) {
  const VersionModel = this.versions[collection];
  const collectionConfig = this.payload.collections[collection].config;
  const options = withSession(this, req.transactionID);

  let hasNearConstraint;
  let sort;

  if (where) {
    const constraints = flattenWhereToOperators(where);
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'));
  }

  if (!hasNearConstraint) {
    sort = buildSortParam({
      sort: sortArg || collectionConfig.defaultSort,
      fields: collectionConfig.fields,
      timestamps: true,
      config: this.payload.config,
      locale,
    });
  }

  const combinedWhere = combineQueries({ latest: { equals: true } }, where);

  const versionQuery = await VersionModel.buildQuery({
    where: combinedWhere,
    locale,
    payload: this.payload,
  });

  const paginationOptions: PaginateOptions = {
    page,
    sort,
    lean: true,
    leanWithId: true,
    useEstimatedCount: hasNearConstraint,
    forceCountFn: hasNearConstraint,
    pagination,
    options,
  };

  if (limit > 0) {
    paginationOptions.limit = limit;
    // limit must also be set here, it's ignored when pagination is false
    paginationOptions.options.limit = limit;
  }

  const result = await VersionModel.paginate(versionQuery, paginationOptions);
  const docs = JSON.parse(JSON.stringify(result.docs));

  return {
    ...result,
    docs: docs.map((doc) => {
      // eslint-disable-next-line no-param-reassign
      doc = {
        _id: doc.parent,
        id: doc.parent,
        ...doc.version,
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
      };

      return sanitizeInternalFields(doc);
    }),
  };
};
