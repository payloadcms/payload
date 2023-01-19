import { Payload } from '../../payload';
import { docHasTimestamps, Where } from '../../types';
import { hasWhereAccessResult } from '../../auth';
import { AccessResult } from '../../config/types';
import { CollectionModel, SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { appendVersionToQueryKey } from './appendVersionToQueryKey';
import { SanitizedGlobalConfig } from '../../globals/config/types';

type Arguments<T> = {
  payload: Payload
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  entityType: 'collection' | 'global'
  doc: T
  locale: string
  accessResult: AccessResult
}

const replaceWithDraftIfAvailable = async <T extends TypeWithID>({
  payload,
  entity,
  entityType,
  doc,
  locale,
  accessResult,
}: Arguments<T>): Promise<T> => {
  const VersionModel = payload.versions[entity.slug] as CollectionModel;

  const queryToBuild: { where: Where } = {
    where: {
      and: [
        {
          'version._status': {
            equals: 'draft',
          },
        },
      ],
    },
  };

  if (entityType === 'collection') {
    queryToBuild.where.and.push({
      parent: {
        equals: doc.id,
      },
    });
  }

  if (docHasTimestamps(doc)) {
    queryToBuild.where.and.push({
      updatedAt: {
        greater_than: doc.updatedAt,
      },
    });
  }

  if (hasWhereAccessResult(accessResult)) {
    const versionAccessResult = appendVersionToQueryKey(accessResult);
    queryToBuild.where.and.push(versionAccessResult);
  }

  const query = await VersionModel.buildQuery(queryToBuild, locale);

  let draft = await VersionModel.findOne(query, {}, {
    lean: true,
    sort: { updatedAt: 'desc' },
  });

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
