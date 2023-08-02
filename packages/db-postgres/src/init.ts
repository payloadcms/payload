/* eslint-disable no-param-reassign */
import { buildVersionCollectionFields } from 'payload/dist/versions/buildCollectionFields';
import { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import { getVersionsModelName } from 'payload/dist/versions/getVersionsModelName';
import type { Init } from 'payload/dist/database/types';
import type { PostgresAdapter } from './types';
import { buildTable } from './schema/build';

export const init: Init = async function init(
  this: PostgresAdapter,
) {
  this.payload.config.collections.forEach(
    (collection: SanitizedCollectionConfig) => {
      buildTable({
        adapter: this,
        buildRelationships: true,
        fields: collection.fields,
        tableName: collection.slug,
      });
    },
  );

  this.payload.config.globals.forEach((global) => {
    // create global model
  });
};
