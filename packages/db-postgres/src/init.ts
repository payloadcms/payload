/* eslint-disable no-param-reassign */
import { eq, sql } from 'drizzle-orm';
import {
  numeric,
  pgEnum,
  pgTable,
  varchar,
  jsonb,
} from 'drizzle-orm/pg-core';
import { pushSchema } from 'drizzle-kit/utils';
import { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import { configToJSONSchema } from 'payload/dist/utilities/configToJSONSchema';
import type { Init } from 'payload/dist/database/types';
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

    // This will prompt if clarifications are needed for Drizzle to push new schema
    const {
      hasDataLoss,
      warnings,
      statementsToExecute,
      apply,
    } = await pushSchema(schema, this.db);

    this.payload.logger.info({
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

    // This should mirror the generated table definition from schema/build.ts
    await this.db.execute(sql`CREATE TABLE IF NOT EXISTS "payload_migrations" (
        id SERIAL PRIMARY KEY,
        name character varying,
        batch numeric,
        schema jsonb,
        created_at timestamp without time zone DEFAULT now() NOT NULL,
        updated_at timestamp without time zone DEFAULT now() NOT NULL
      );`);

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

    await apply();
  }
};
