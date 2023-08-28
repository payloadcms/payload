/* eslint-disable no-param-reassign */
import { pgEnum } from 'drizzle-orm/pg-core';
// import { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import { SanitizedCollectionConfig } from '@alessiogr/payloadtest/types';
import type { Init } from '@alessiogr/payloadtest/database';
import { buildTable } from './schema/build.js';
import type { PostgresAdapter } from './types.js';

export const init: Init = async function init(this: PostgresAdapter) {
  if (this.payload.config.localization) {
    this.enums._locales = pgEnum(
      '_locales',
      // @ts-ignore // TODO: Fix this
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
