import type { MongooseAdapter } from '.';
import { PaginatedDocs } from './types';
import { QueryDraftsArgs } from '../database/types';
import flattenWhereToOperators from '../database/flattenWhereToOperators';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

type AggregateVersion<T> = {
  _id: string
  version: T
  updatedAt: string
  createdAt: string
}

export async function queryDrafts<T = unknown>(
  this: MongooseAdapter,
  { collection, where, page, limit, sort, locale, pagination }: QueryDraftsArgs,
): Promise<PaginatedDocs<T>> {
  const VersionModel = this.versions[collection];

  const versionQuery = await VersionModel.buildQuery({
    where,
    locale,
    payload: this.payload,
  });

  const aggregate = VersionModel.aggregate<AggregateVersion<T>>([
    // Sort so that newest are first
    { $sort: { updatedAt: -1 } },
    // Group by parent ID, and take the first of each
    {
      $group: {
        _id: '$parent',
        version: { $first: '$version' },
        updatedAt: { $first: '$updatedAt' },
        createdAt: { $first: '$createdAt' },
      },
    },
    // Filter based on incoming query
    { $match: versionQuery },
  ], {
    allowDiskUse: true,
  });

  let result;

  if (pagination) {
    let useEstimatedCount;

    if (where) {
      const constraints = flattenWhereToOperators(where);
      useEstimatedCount = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'));
    }


    const aggregatePaginateOptions = {
      page,
      limit,
      lean: true,
      leanWithId: true,
      useEstimatedCount,
      pagination,
      useCustomCountFn: pagination ? undefined : () => Promise.resolve(1),
      useFacet: this.connectOptions.useFacet,
      options: {
        limit,
      },
      sort: sort.reduce((acc, cur) => {
        let sanitizedSortProperty = cur.property;
        const sanitizedSortOrder = cur.order === 'asc' ? 1 : -1;

        if (!['createdAt', 'updatedAt', '_id'].includes(cur.property)) {
          sanitizedSortProperty = `version.${cur.property}`;
        }
        acc[sanitizedSortProperty] = sanitizedSortOrder;
        return acc;
      }, {}),
    };

    result = await VersionModel.aggregatePaginate(aggregate, aggregatePaginateOptions);
  } else {
    result = aggregate.exec();
  }

  return {
    ...result,
    docs: result.docs.map((doc) => {
      let sanitizedDoc = {
        _id: doc._id,
        ...doc.version,
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
      };

      sanitizedDoc = JSON.parse(JSON.stringify(sanitizedDoc));
      sanitizedDoc.id = sanitizedDoc._id;
      return sanitizeInternalFields(sanitizedDoc);
    }),
  };
}
