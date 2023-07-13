import type { PaginateOptions } from 'mongoose';
import type { MongooseAdapter } from '.';
import type { Find } from '../database/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';
import flattenWhereToOperators from '../database/flattenWhereToOperators';
import { buildSortParam } from './queries/buildSortParam';
import { withSession } from './withSession';

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
    transactionID,
  },
) {
  const Model = this.collections[collection];
  const collectionConfig = this.payload.collections[collection].config;
  const options = withSession(this, transactionID);

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
