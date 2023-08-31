import { PaginateOptions } from 'mongoose';
import { AccessResult } from '../../config/types';
import { PayloadRequest, Where } from '../../types';
import { Payload } from '../../payload';
import { PaginatedDocs } from '../../mongoose/types';
import { Collection, CollectionModel, TypeWithID } from '../../collections/config/types';
import { combineQueries } from '../../database/combineQueries';

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
  where,
}: Args): Promise<PaginatedDocs<T>> => {
  const VersionModel = payload.versions[collection.config.slug] as CollectionModel;

  const combinedQuery = combineQueries({ latest: { equals: true } }, where);

  const versionsQuery = await VersionModel.buildQuery({
    where: combinedQuery,
    access: accessResult,
    req,
    overrideAccess,
  });

  let result;

  if (paginationOptions) {
    const paginationOptionsToUse: PaginateOptions = {
      ...paginationOptions,
      lean: true,
      leanWithId: true,
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

    result = await VersionModel.paginate(versionsQuery, paginationOptionsToUse);
  } else {
    result = await VersionModel.find(versionsQuery);
  }

  return {
    ...result,
    docs: result.docs.map((doc) => ({
      _id: doc.parent,
      id: doc.parent,
      ...doc.version,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
    })),
  };
};
