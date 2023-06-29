import type { MongooseAdapter } from '.';
import type { FindVersions } from '../database/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';
import flattenWhereToOperators from '../database/flattenWhereToOperators';
import { buildSortParam } from './queries/buildSortParam';

export const findVersions: FindVersions = async function findVersions(this: MongooseAdapter,
  { collection, where, page, limit, sort: sortArg, locale, pagination, skip }) {
  const Model = this.versions[collection];
  const collectionConfig = this.payload.collections[collection].config;

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

  const paginationOptions = {
    page,
    sort,
    limit,
    lean: true,
    leanWithId: true,
    pagination,
    offset: skip,
    useEstimatedCount: hasNearConstraint,
    forceCountFn: hasNearConstraint,
    options: {
      // limit must also be set here, it's ignored when pagination is false
      limit,
      skip,
    },
  };

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
