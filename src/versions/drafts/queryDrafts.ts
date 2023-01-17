import { AccessResult } from '../../config/types';
import { Where } from '../../types';
import { Payload } from '../..';
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
  paginationOptions: any
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

  // TODO
  // 1. Before group, we could potentially run $match to reduce matches
  // 2. Then before group, need to sort by updatedAt so first versions are newest versions
  // 3. Finally can group
  // 4. Then need to sort on user-defined sort again, if it differs from default

  const aggregate = VersionModel.aggregate<AggregateVersion<T>>([
    {
      $sort: Object.entries(paginationOptions.sort).reduce((sort, [key, order]) => {
        return {
          ...sort,
          [key]: order === 'asc' ? 1 : -1,
        };
      }, {}),
    },
    {
      $group: {
        _id: '$parent',
        versionID: { $first: '$_id' },
        version: { $first: '$version' },
        updatedAt: { $first: '$updatedAt' },
        createdAt: { $first: '$createdAt' },
      },
    },
    { $match: versionQuery },
    { $limit: paginationOptions.limit },
  ]);

  const result = await VersionModel.aggregatePaginate(aggregate, paginationOptions);

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
