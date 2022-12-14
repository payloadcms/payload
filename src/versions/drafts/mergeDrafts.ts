import { AccessResult } from '../../config/types';
import { docHasTimestamps, Where } from '../../types';
import { Payload } from '../..';
import { PaginatedDocs } from '../../mongoose/types';
import { Collection, CollectionModel, TypeWithID } from '../../collections/config/types';
import { hasWhereAccessResult } from '../../auth';
import { appendVersionToQueryKey } from './appendVersionToQueryKey';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import replaceWithDraftIfAvailable from './replaceWithDraftIfAvailable';

type AggregateVersion<T> = {
  _id: string
  version: T
  updatedAt: string
  createdAt: string
}

type Args<T> = {
  accessResult: AccessResult
  collection: Collection
  locale: string
  originalQueryResult: PaginatedDocs<T>
  paginationOptions: any
  payload: Payload
  where: Where
}

export const mergeDrafts = async <T extends TypeWithID>({
  accessResult,
  collection,
  locale,
  originalQueryResult,
  payload,
  paginationOptions,
  where: incomingWhere,
}: Args<T>): Promise<PaginatedDocs<T>> => {
  const VersionModel = payload.versions[collection.config.slug] as CollectionModel;

  const where = appendVersionToQueryKey(incomingWhere || {});

  const versionQueryToBuild: { where: Where } = {
    where: {
      ...where,
      and: [
        ...where?.and || [],
        {
          'version._status': {
            equals: 'draft',
          },
        },
      ],
    },
  };

  if (hasWhereAccessResult(accessResult)) {
    const versionAccessResult = appendVersionToQueryKey(accessResult);
    versionQueryToBuild.where.and.push(versionAccessResult);
  }

  const versionQuery = await VersionModel.buildQuery(versionQueryToBuild, locale);

  const matchedDraftVersions = await VersionModel.aggregate<AggregateVersion<T>>([
    { $sort: { updatedAt: -1 } },
    { $match: versionQuery },
    {
      $group: {
        _id: '$parent',
        version: { $first: '$version' },
        updatedAt: { $first: '$updatedAt' },
        createdAt: { $first: '$createdAt' },
      },
    },
  ]);

  const matchedDrafts: AggregateVersion<T>[] = [];
  const unmatchedDrafts: AggregateVersion<T>[] = [];

  matchedDraftVersions.forEach((draft) => {
    const matchedDocFromOriginalQuery = originalQueryResult.docs.find(({ id }) => id === draft._id);
    const sanitizedDraft = JSON.parse(JSON.stringify(draft));

    // If we find a matched doc from the original query,
    // No need to store this doc
    if (matchedDocFromOriginalQuery) {
      matchedDrafts.push(sanitizedDraft);
    } else {
      unmatchedDrafts.push(sanitizedDraft);
    }
  });

  let result = originalQueryResult;

  // If there are results from drafts,
  // we need to re-query while explicitly passing in
  // the IDs of the un-matched drafts so that they appear correctly
  // in paginated results, properly paginated
  if (unmatchedDrafts.length > 0) {
    const whereWithUnmatchedIDs: { where: Where } = {
      where: {
        and: [],
      },
    };

    if (hasWhereAccessResult(accessResult)) {
      whereWithUnmatchedIDs.where.and.push(accessResult);
    }

    if (where) {
      whereWithUnmatchedIDs.where.and.push({
        or: [
          where,
          {
            id: {
              in: unmatchedDrafts.map(({ _id }) => _id),
            },
          },
        ],
      });
    }

    const queryWithUnmatchedIDs = await collection.Model.buildQuery(whereWithUnmatchedIDs, locale);

    result = await collection.Model.paginate(queryWithUnmatchedIDs, paginationOptions);

    result = {
      ...result,
      docs: result.docs.map((doc) => {
        const sanitizedDoc = JSON.parse(JSON.stringify(doc));
        sanitizedDoc.id = sanitizedDoc._id;
        return sanitizeInternalFields(sanitizedDoc);
      }),
    };
  }

  result = {
    ...result,
    docs: await Promise.all(result.docs.map(async (doc) => {
      // If we have an existing unmatched draft, we can replace with that if it's newer
      const correlatedUnmatchedDraft = unmatchedDrafts.find(({ _id, updatedAt }) => _id === doc.id && docHasTimestamps(doc) && updatedAt > doc.updatedAt);

      if (correlatedUnmatchedDraft) {
        return {
          ...doc,
          ...correlatedUnmatchedDraft.version,
          createdAt: correlatedUnmatchedDraft.createdAt,
          updatedAt: correlatedUnmatchedDraft.updatedAt,
        };
      }

      const correlatedMatchedDraft = matchedDrafts.find(({ _id, updatedAt }) => _id === doc.id && docHasTimestamps(doc) && updatedAt > doc.updatedAt);

      if (correlatedMatchedDraft) {
        return {
          ...doc,
          ...correlatedMatchedDraft.version,
          createdAt: correlatedMatchedDraft.createdAt,
          updatedAt: correlatedMatchedDraft.updatedAt,
        };
      }

      return replaceWithDraftIfAvailable({
        accessResult,
        payload,
        entity: collection.config,
        entityType: 'collection',
        doc,
        locale,
      });
    })),
  };

  return result;
};
