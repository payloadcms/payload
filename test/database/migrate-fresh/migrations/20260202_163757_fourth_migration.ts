import type { MigrateDownArgs, MigrateUpArgs } from 'payload'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // Migration up logic
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.find({ collection: 'test-collection' }) // should not error
}
