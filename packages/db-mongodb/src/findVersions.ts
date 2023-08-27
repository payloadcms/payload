import { PaginateOptions } from 'mongoose';
import type { FindVersions } from '@alessiogr/payloadtest/database';
import { flattenWhereToOperators } from '@alessiogr/payloadtest/database';
import { PayloadRequest } from '@alessiogr/payloadtest/types';
import sanitizeInternalFields from './utilities/sanitizeInternalFields.js';
import type { MongooseAdapter } from '.';
import { buildSortParam } from './queries/buildSortParam.js';
import { withSession } from './withSession.js';

export const findVersions: FindVersions = async function findVersions(
  this: MongooseAdapter,
  {
    collection,
    where,
    page,
    limit,
    sort: sortArg,
    locale,
    pagination,
    skip,
    req = {} as PayloadRequest,
  },
) {
  const Model = this.versions[collection];
  const collectionConfig = this.payload.collections[collection].config;
  const options = {
    ...withSession(this, req.transactionID),
    skip,
    limit,
  };

  let hasNearConstraint = false;

  if (where) {
    const constraints = flattenWhereToOperators(where);
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'));
  }

  let sort;
  if (!hasNearConstraint) {
    sort = buildSortParam({
      sort: sortArg || '-updatedAt',
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
    limit,
    lean: true,
    leanWithId: true,
    pagination,
    offset: skip,
    useEstimatedCount: hasNearConstraint,
    forceCountFn: hasNearConstraint,
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
