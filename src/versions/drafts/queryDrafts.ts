import { PaginateOptions } from 'mongoose';
import { AccessResult } from '../../config/types';
import { PayloadRequest, Where } from '../../types';
import { Payload } from '../../payload';
import { PaginatedDocs } from '../../mongoose/types';
import { Collection, CollectionModel, TypeWithID } from '../../collections/config/types';
import { hasWhereAccessResult } from '../../auth';
import { appendVersionToQueryKey } from './appendVersionToQueryKey';

type AggregateVersion<T> = {
  _id: string
  version: T
  updatedAt: string
  createdAt: string
}

type Args = {
  accessResult: AccessResult
  collection: Collection
  req: PayloadRequest
  overrideAccess: boolean
  paginationOptions?: PaginateOptions
  payload: Payload
  where: Where
}

export const queryDrafts = async <T extends TypeWithID>({
  accessResult,
  collection,
  req,
  overrideAccess,
  payload,
  paginationOptions,
  where: incomingWhere,
}: Args): Promise<PaginatedDocs<T>> => {
  const VersionModel = payload.versions[collection.config.slug] as CollectionModel;

  const where = appendVersionToQueryKey(incomingWhere || {});

  const versionQueryToBuild: Where = {
    ...where,
    and: [
      ...where?.and || [],
    ],
  };

  if (hasWhereAccessResult(accessResult)) {
    const versionAccessResult = appendVersionToQueryKey(accessResult);
    versionQueryToBuild.and.push(versionAccessResult);
  }

  const versionQuery = await VersionModel.buildQuery({
    where: versionQueryToBuild,
    req,
    overrideAccess,
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
      sort: Object.entries(paginationOptions.sort)
        .reduce((sort, [incomingSortKey, order]) => {
          let key = incomingSortKey;

          if (!['createdAt', 'updatedAt', '_id'].includes(incomingSortKey)) {
            key = `version.${incomingSortKey}`;
          }

          return {
            ...sort,
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
};
