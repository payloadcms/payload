import type { PaginateOptions } from 'mongoose';
import type { Find } from 'payload/database';
import { flattenWhereToOperators } from 'payload/database';
import { PayloadRequest } from 'payload/types';
import sanitizeInternalFields from './utilities/sanitizeInternalFields.js';
import { buildSortParam } from './queries/buildSortParam.js';
import type { MongooseAdapter } from './index.js';
import { withSession } from './withSession.js';

export const find: Find = async function find(
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
  const Model = this.collections[collection];
  const collectionConfig = this.payload.collections[collection].config;
  const options = withSession(this, req.transactionID);

  let hasNearConstraint = false;

  if (where) {
    const constraints = flattenWhereToOperators(where);
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'));
  }

  let sort;
  if (!hasNearConstraint) {
    sort = buildSortParam({
      sort: sortArg || collectionConfig.defaultSort,
      fields: collectionConfig.fields,
      timestamps: true,
      config: this.payload.config,
      locale,
    });
  }

  const query = await Model.buildQuery({
    payload: this.payload,
    locale,
    where,
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

  const result = await Model.paginate(query, paginationOptions);
  const docs = JSON.parse(JSON.stringify(result.docs));

  return {
    ...result,
    docs: docs.map((doc) => {
      // eslint-disable-next-line no-param-reassign
      doc.id = doc._id;
      return sanitizeInternalFields(doc);
    }),
  };
};
