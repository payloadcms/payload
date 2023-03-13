import { PaginateOptions } from 'mongoose';
import { AccessResult } from '../../config/types';
import { Where } from '../../types';
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
  locale: string
  paginationOptions: PaginateOptions
  payload: Payload
  where: Where
}

export const queryDrafts = async <T extends TypeWithID>({
  accessResult,
  collection,
  locale,
  payload,
  paginationOptions,
  where: incomingWhere,
}: Args): Promise<PaginatedDocs<T>> => {
  const VersionModel = payload.versions[collection.config.slug] as CollectionModel;

  const where = appendVersionToQueryKey(incomingWhere || {});

  const versionQueryToBuild: { where: Where } = {
    where: {
      ...where,
      and: [
        ...where?.and || [],
      ],
    },
  };

  if (hasWhereAccessResult(accessResult)) {
    const versionAccessResult = appendVersionToQueryKey(accessResult);
    versionQueryToBuild.where.and.push(versionAccessResult);
  }

  const versionQuery = await VersionModel.buildQuery(versionQueryToBuild, locale);

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

  const aggregatePaginateOptions = {
    ...paginationOptions,
    useFacet: payload.mongoOptions?.useFacet,
    sort: Object.entries(paginationOptions.sort).reduce((sort, [incomingSortKey, order]) => {
      let key = incomingSortKey;

      if (!['createdAt', 'updatedAt', '_id'].includes(incomingSortKey)) {
        key = `version.${incomingSortKey}`
      }

      return {
        ...sort,
        [key]: order === 'asc' ? 1 : -1,
      };
    }, {})
  }

  const result = await VersionModel.aggregatePaginate(aggregate, aggregatePaginateOptions);

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
