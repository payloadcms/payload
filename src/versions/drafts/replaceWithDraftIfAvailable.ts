import { docHasTimestamps, PayloadRequest, Where } from '../../types';
import { hasWhereAccessResult } from '../../auth';
import { AccessResult } from '../../config/types';
import { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { appendVersionToQueryKey } from './appendVersionToQueryKey';
import { SanitizedGlobalConfig } from '../../globals/config/types';
import { combineQueries } from '../../database/combineQueries';
import type { FindGlobalVersionsArgs, FindVersionsArgs } from '../../database/types';

type Arguments<T> = {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  entityType: 'collection' | 'global'
  doc: T
  req: PayloadRequest
  overrideAccess: boolean
  accessResult: AccessResult
}

const replaceWithDraftIfAvailable = async <T extends TypeWithID>({
  entity,
  entityType,
  doc,
  req,
  accessResult,
}: Arguments<T>): Promise<T> => {
  const queryToBuild: Where = {
    and: [
      {
        'version._status': {
          equals: 'draft',
        },
      },
    ],
  };

  if (entityType === 'collection') {
    queryToBuild.and.push({
      parent: {
        equals: doc.id,
      },
    });
  }

  if (docHasTimestamps(doc)) {
    queryToBuild.and.push({
      updatedAt: {
        greater_than: doc.updatedAt,
      },
    });
  }

  let versionAccessResult;

  if (hasWhereAccessResult(accessResult)) {
    versionAccessResult = appendVersionToQueryKey(accessResult);
  }


  const findVersionsArgs: FindVersionsArgs & FindGlobalVersionsArgs = {
    locale: req.locale,
    where: combineQueries(queryToBuild, versionAccessResult),
    collection: entity.slug,
    global: entity.slug,
    limit: 1,
    sort: '-updatedAt',
  };

  let versionDocs;
  if (entityType === 'global') {
    versionDocs = (await req.payload.db.findGlobalVersions<T>(findVersionsArgs)).docs;
  } else {
    versionDocs = (await req.payload.db.findVersions<T>(findVersionsArgs)).docs;
  }

  let draft = versionDocs[0];


  if (!draft) {
    return doc;
  }

  draft = JSON.parse(JSON.stringify(draft));
  draft = sanitizeInternalFields(draft);

  // Disregard all other draft content at this point,
  // Only interested in the version itself.
  // Operations will handle firing hooks, etc.
  return {
    id: doc.id,
    ...draft.version,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
};

export default replaceWithDraftIfAvailable;
