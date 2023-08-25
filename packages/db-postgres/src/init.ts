/* eslint-disable no-param-reassign */
import { pgEnum } from 'drizzle-orm/pg-core';
import { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import type { Init } from 'payload/dist/database/types';
import { buildTable } from './schema/build';
import type { PostgresAdapter } from './types';

export const init: Init = async function init(this: PostgresAdapter) {
  if (this.payload.config.localization) {
    this.enums._locales = pgEnum(
      '_locales',
      // TODO: types out of sync with core, monorepo please
      // this.payload.config.localization.localeCodes,
      (this.payload.config.localization.locales as unknown as {code: string}[]).map(({ code }) => code) as [string, ...string[]],
    );
  }

  this.payload.config.collections.forEach((collection: SanitizedCollectionConfig) => {
    buildTable({
      adapter: this,
      buildRelationships: true,
      fields: collection.fields,
      tableName: collection.slug,
      timestamps: collection.timestamps,
    });
  });

  this.payload.config.globals.forEach((global) => {
    // create global model
  });
};
