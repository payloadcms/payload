import type { CreateVersion } from 'payload/dist/database/types';
import { buildVersionCollectionFields } from 'payload/dist/versions/buildCollectionFields';
import toSnakeCase from 'to-snake-case';
import type { PostgresAdapter } from './types';
import { upsertRow } from './upsertRow';

export const createVersion: CreateVersion = async function createVersion(
  this: PostgresAdapter,
  {
    collectionSlug,
    parent,
    versionData,
    autosave,
    createdAt,
    updatedAt,
  },
) {
  const collection = this.payload.collections[collectionSlug].config;
  const tableName = toSnakeCase(collectionSlug);

  const result = await upsertRow({
    adapter: this,
    data: {
      parent,
      latest: true,
      autosave,
      createdAt,
      updatedAt,
      version: versionData,
    },
    fields: buildVersionCollectionFields(collection),
    operation: 'create',
    tableName: `_${tableName}_versions`,
  });

  // const [doc] = await VersionModel.create(
  //   [
  //     {
  //       parent,
  //       version: versionData,
  //       latest: true,
  //       autosave,
  //       createdAt,
  //       updatedAt,
  //     },
  //   ],
  //   options,
  //   req,
  // );

  // await VersionModel.updateMany({
  //   $and: [
  //     {
  //       _id: {
  //         $ne: doc._id,
  //       },
  //     },
  //     {
  //       parent: {
  //         $eq: parent,
  //       },
  //     },
  //     {
  //       latest: {
  //         $eq: true,
  //       },
  //     },
  //   ],
  // }, { $unset: { latest: 1 } });

  return result;
};
