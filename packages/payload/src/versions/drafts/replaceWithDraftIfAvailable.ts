import { docHasTimestamps, PayloadRequest, Where } from '../../types.js';
import { hasWhereAccessResult } from '../../auth.js';
import { AccessResult } from '../../config/types.js';
import { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types.js';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields.js';
import { appendVersionToQueryKey } from './appendVersionToQueryKey.js';
import { SanitizedGlobalConfig } from '../../globals/config/types.js';
import { combineQueries } from '../../database/combineQueries.js';
import type { FindGlobalVersionsArgs, FindVersionsArgs } from '../../database/types.js';

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
  const {
    locale,
  } = req;

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
    locale,
    where: combineQueries(queryToBuild, versionAccessResult),
    collection: entity.slug,
    global: entity.slug,
    limit: 1,
    sort: '-updatedAt',
    req,
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
