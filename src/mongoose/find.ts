import type { MongooseAdapter } from '.';
import { PaginatedDocs } from './types';
import { FindArgs } from '../database/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';
import flattenWhereToOperators from '../database/flattenWhereToOperators';

export async function find<T = unknown>(
  this: MongooseAdapter,
  { payload, collection, where, page, limit, sortProperty, sortOrder, locale, pagination }: FindArgs,
): Promise<PaginatedDocs<T>> {
  const Model = this.collections[collection.slug];

  let useEstimatedCount = false;

  if (where) {
    const constraints = flattenWhereToOperators(where);
    useEstimatedCount = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'));
  }

  const query = await Model.buildQuery({
    payload,
    locale,
    where,
  });

  const paginationOptions = {
    page,
    sort: {
      [sortProperty]: sortOrder,
    },
    limit,
    lean: true,
    leanWithId: true,
    useEstimatedCount,
    pagination,
    useCustomCountFn: pagination ? undefined : () => Promise.resolve(1),
    options: {
      // limit must also be set here, it's ignored when pagination is false
      limit,
    },
  };

  const result = await Model.paginate(query, paginationOptions);

  return {
    ...result,
    docs: result.docs.map((doc) => {
      const sanitizedDoc = JSON.parse(JSON.stringify(doc));
      sanitizedDoc.id = sanitizedDoc._id;
      return sanitizeInternalFields(sanitizedDoc);
    }),
  };
}
