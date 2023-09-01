/* eslint-disable no-param-reassign */
import type { Init } from 'payload/database';
// import { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import type { SanitizedCollectionConfig } from 'payload/types';

import { pgEnum } from 'drizzle-orm/pg-core';

import type { PostgresAdapter } from './types';

import { buildTable } from './schema/build';

export const init: Init = async function init(this: PostgresAdapter) {
  if (this.payload.config.localization) {
    this.enums._locales = pgEnum(
      '_locales',
      this.payload.config.localization.locales as [string, ...string[]],
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
