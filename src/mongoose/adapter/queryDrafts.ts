import type { MongooseAdapter } from '.';
import { PaginatedDocs } from '../types';
import { QueryDraftsArgs } from '../../database/types';

type AggregateVersion<T> = {
  _id: string
  version: T
  updatedAt: string
  createdAt: string
}

export async function queryDrafts<T = any>(
  this: MongooseAdapter,
  { payload, collection, where, page, limit, sort, locale }: QueryDraftsArgs,
): Promise<PaginatedDocs<T>> {
  const VersionModel = this.versions[collection.slug];

  const versionQuery = await VersionModel.buildQuery({
    where,
    locale,
    payload,
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

  if (paginationOptions) {
    const aggregatePaginateOptions = {
      ...paginationOptions,
      useFacet: payload.mongoOptions?.useFacet,
      sort: Object.entries(sort)
        .reduce((acc, [incomingSortKey, order]) => {
          let key = incomingSortKey;

          if (!['createdAt', 'updatedAt', '_id'].includes(incomingSortKey)) {
            key = `version.${incomingSortKey}`;
          }

          return {
            ...acc,
            [key]: order === 'asc' ? 1 : -1,
          };
        }, {}),
    };

    result = await VersionModel.aggregatePaginate(aggregate, aggregatePaginateOptions);
  } else {
    result = aggregate.exec();
  }

  return {
    ...result,
    docs: result.docs.map((doc) => ({
      _id: doc._id,
      ...doc.version,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
    })),
  };
}
