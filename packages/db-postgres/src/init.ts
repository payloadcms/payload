/* eslint-disable no-param-reassign */
import { pushSchema } from 'drizzle-kit/utils';
import { eq } from 'drizzle-orm';
import {
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  varchar,
} from 'drizzle-orm/pg-core';
import { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import type { Init } from 'payload/dist/database/types';
import { configToJSONSchema } from 'payload/dist/utilities/configToJSONSchema';
import prompts from 'prompts';
import { buildTable } from './schema/build';
import type { GenericEnum, GenericRelation, GenericTable, PostgresAdapter } from './types';

// Migration table def in order to use query using drizzle
const migrationsSchema = pgTable('payload_migrations', {
  name: varchar('name'),
  batch: numeric('batch'),
  schema: jsonb('schema'),
});

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

  // Only push schema if not in production
  if (process.env.NODE_ENV === 'production') return;

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

  // This will prompt if clarifications are needed for Drizzle to push new schema
  const {
    hasDataLoss,
    warnings,
    statementsToExecute,
    apply,
  } = await pushSchema(schema, this.db);

  this.payload.logger.debug({
    msg: 'Schema push results',
    hasDataLoss,
    warnings,
    statementsToExecute,
  });

  if (warnings.length) {
    this.payload.logger.warn({
      msg: `Warnings detected during schema push: ${warnings.join('\n')}`,
      warnings,
    });

    if (hasDataLoss) {
      this.payload.logger.warn({
        msg: 'DATA LOSS WARNING: Possible data loss detected if schema is pushed.',
      });
    }

    const { confirm: acceptWarnings } = await prompts(
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Accept warnings and push schema to database?',
        initial: false,
      },
      {
        onCancel: () => {
          process.exit(0);
        },
      },
    );

    // Exit if user does not accept warnings.
    // Q: Is this the right type of exit for this interaction?
    if (!acceptWarnings) {
      process.exit(0);
    }
  }

  const jsonSchema = configToJSONSchema(this.payload.config);

  await apply();

  const devPush = await this.db.select().from(migrationsSchema).where(eq(migrationsSchema.batch, '-1'));

  if (!devPush.length) {
    await this.db.insert(migrationsSchema).values({
      name: 'dev',
      batch: '-1',
      schema: JSON.stringify(jsonSchema),
    });
  } else {
    await this.db.update(migrationsSchema).set({
      schema: JSON.stringify(jsonSchema),
    }).where(eq(migrationsSchema.batch, '-1'));
  }
};
