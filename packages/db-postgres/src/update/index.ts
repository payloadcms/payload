import { UpdateOne } from 'payload/dist/database/types';
import toSnakeCase from 'to-snake-case';
// import { insertRow } from './insertRow';

export const updateOne: UpdateOne = async function updateOne({
  collection: collectionSlug,
  data,
  req,
}) {
  // const collection = this.payload.collections[collectionSlug].config;

  // const result = await insertRow({
  //   adapter: this,
  //   data,
  //   fallbackLocale: req.fallbackLocale,
  //   fields: collection.fields,
  //   locale: req.locale,
  //   operation: 'update',
  //   tableName: toSnakeCase(collectionSlug),
  // });

  // return result;
};
