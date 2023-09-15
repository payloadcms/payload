import type { CreateVersion } from 'payload/database';

import { buildVersionCollectionFields } from 'payload/versions';
import toSnakeCase from 'to-snake-case';

import type { PostgresAdapter } from './types';

import { upsertRow } from './upsertRow';

export const createVersion: CreateVersion = async function createVersion(
  this: PostgresAdapter,
  {
    autosave,
    collectionSlug,
    createdAt,
    parent,
    updatedAt,
    versionData,
  },
) {
  const collection = this.payload.collections[collectionSlug].config;
  const tableName = toSnakeCase(collectionSlug);

  const result = await upsertRow({
    adapter: this,
    data: {
      autosave,
      createdAt,
      latest: true,
      parent,
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
