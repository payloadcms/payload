import { FilterQuery } from 'mongoose';
import { Payload } from '../payload';
import { CollectionModel, SanitizedCollectionConfig } from '../collections/config/types';
import { Where } from '../types';
import { SanitizedGlobalConfig } from '../globals/config/types';

type Args = {
  payload: Payload
  Model: CollectionModel
  max: number
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: string | number
}

export const enforceMaxVersions = async ({
  payload,
  Model,
  max,
  collection,
  global,
  id,
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
        payload,
        where,
        collection,
        skip: max,
        sortProperty: 'updatedAt',
        sortOrder: 'desc',
        pagination: false,
      });

      [oldestAllowedDoc] = query.docs;
    } else if (global) {
      const query = await payload.db.findGlobalVersions({
        payload,
        where,
        global,
        skip: max,
        sortProperty: 'updatedAt',
        sortOrder: 'desc',
      });

      [oldestAllowedDoc] = query.docs;
    }

    if (oldestAllowedDoc?.updatedAt) {
      const deleteQuery: FilterQuery<unknown> = {
        updatedAt: {
          $lte: oldestAllowedDoc.updatedAt,
        },
      };

      if (collection) deleteQuery.parent = id;

      await Model.deleteMany(deleteQuery);
    }
  } catch (err) {
    payload.logger.error(`There was an error cleaning up old versions for the ${entityType} ${slug}`);
  }
};
