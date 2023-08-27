import { Payload } from '../payload.js';
import type { SanitizedCollectionConfig } from '../collections/config/types.js';
import type { SanitizedGlobalConfig } from '../globals/config/types.js';
import type { Where } from '../types/index.js';
import { PayloadRequest } from '../types/index.js';

type Args = {
  payload: Payload
  max: number
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: string | number
  req?: PayloadRequest
}

export const enforceMaxVersions = async ({
  payload,
  max,
  collection,
  global,
  id,
  req,
}: Args): Promise<void> => {
  const entityType = collection ? 'collection' : 'global';
  const slug = collection ? collection.slug : global?.slug;

  try {
    const where: Where = {};
    let oldestAllowedDoc;

    if (collection) {
      where.parent = {
        equals: id,
      };

      const query = await payload.db.findVersions({
        where,
        collection: collection.slug,
        skip: max,
        sort: '-updatedAt',
        pagination: false,
        req,
      });

      [oldestAllowedDoc] = query.docs;
    } else if (global) {
      const query = await payload.db.findGlobalVersions({
        where,
        global: global.slug,
        skip: max,
        sort: '-updatedAt',
        req,
      });

      [oldestAllowedDoc] = query.docs;
    }

    if (oldestAllowedDoc?.updatedAt) {
      const deleteQuery: Where = {
        updatedAt: {
          less_than_equal: oldestAllowedDoc.updatedAt,
        },
      };

      if (collection) {
        deleteQuery.parent = {
          equals: id,
        };
      }

      await payload.db.deleteVersions({
        collection: collection?.slug,
        where: deleteQuery,
        req,
      });
    }
  } catch (err) {
    payload.logger.error(`There was an error cleaning up old versions for the ${entityType} ${slug}`);
  }
};
