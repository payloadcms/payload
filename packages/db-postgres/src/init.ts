/* eslint-disable no-param-reassign */
import { generateDrizzleJson, generateMigration, pushSchema } from 'drizzle-kit/utils';
import { buildVersionCollectionFields } from 'payload/dist/versions/buildCollectionFields';
import { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import { getVersionsModelName } from 'payload/dist/versions/getVersionsModelName';
import type { Init } from 'payload/dist/database/types';
import { pgEnum } from 'drizzle-orm/pg-core';
import type { GenericEnum, GenericRelation, GenericTable, PostgresAdapter } from './types';
import { buildTable } from './schema/build';

export const init: Init = async function init(
  this: PostgresAdapter,
) {
  if (this.payload.config.localization) {
    this.enums._locales = pgEnum('_locales', this.payload.config.localization.locales as [string, ...string[]]);
  }

  this.payload.config.collections.forEach(
    (collection: SanitizedCollectionConfig) => {
      buildTable({
        adapter: this,
        buildRelationships: true,
        fields: collection.fields,
        tableName: collection.slug,
        timestamps: collection.timestamps,
      });
    },
  );

  this.payload.config.globals.forEach((global) => {
    // create global model
  });

  if (process.env.NODE_ENV !== 'production') {
    // TODO:
    // Run migrate here????
    // We need to make sure the files in the `migrationsDir` are all executed

    const schema: Record<string, GenericEnum | GenericTable | GenericRelation> = {};

    Object.entries(this.tables).forEach(([key, val]) => {
      schema[`table_${key}`] = val;
    });

    Object.entries(this.relations).forEach(([key, val]) => {
      schema[`relation_${key}`] = val;
    });

    Object.entries(this.enums).forEach(([key, val]) => {
      schema[`enum_${key}`] = val;
    });

    const {
      hasDataLoss,
      warnings,
      statementsToExecute,
      apply,
    } = await pushSchema(schema, this.db);

    // TODO:
    // if there are warnings, make the user accept them via CLI
    // Log the warnings and the statements, etc.
    // Only apply if user accepts warnings

    // TODO:
    // PUSH MIGRATION RECORD to db with shape of JSON schema
    // this migration needs to have some "flag" that says "pushed"
    // we don't want 1000 pushes in dev mode, just update the most recently pushed one
    // to do this, we will say "give me the most recent migration in the DB"
    // if pushed: true, update that one with the new schema
    // if pushed is false or does not exist, create a new migration
    // with pushed: true and the shape of the schema (generated via generateDrizzleJSON)

    await apply();
  }
};
