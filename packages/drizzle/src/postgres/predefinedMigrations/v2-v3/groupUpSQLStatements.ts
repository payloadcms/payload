export type Groups =
  | 'addColumn'
  | 'addConstraint'
  | 'alterType'
  | 'createIndex'
  | 'createTable'
  | 'createType'
  | 'disableRowSecurity'
  | 'dropColumn'
  | 'dropConstraint'
  | 'dropIndex'
  | 'dropTable'
  | 'dropType'
  | 'notNull'
  | 'renameColumn'
  | 'setDefault'

/**
 * Convert an "ADD COLUMN" statement to an "ALTER COLUMN" statement.
 * Works with or without a schema name.
 *
 * Examples:
 * 'ALTER TABLE "pages_blocks_my_block" ADD COLUMN "person_id" integer NOT NULL;'
 * => 'ALTER TABLE "pages_blocks_my_block" ALTER COLUMN "person_id" SET NOT NULL;'
 *
 * 'ALTER TABLE "public"."pages_blocks_my_block" ADD COLUMN "person_id" integer NOT NULL;'
 * => 'ALTER TABLE "public"."pages_blocks_my_block" ALTER COLUMN "person_id" SET NOT NULL;'
 */
function convertAddColumnToAlterColumn(sql) {
  // Regular expression to match the ADD COLUMN statement with its constraints
  const regex = /ALTER TABLE ((?:"[^"]+"\.)?"[^"]+") ADD COLUMN ("[^"]+") [^;]*?NOT NULL;/i

  // Replace the matched part with "ALTER COLUMN ... SET NOT NULL;"
  return sql.replace(regex, 'ALTER TABLE $1 ALTER COLUMN $2 SET NOT NULL;')
}

export const groupUpSQLStatements = (list: string[]): Record<Groups, string[]> => {
  const groups = {
    /**
     * example: ALTER TABLE "posts" ADD COLUMN "category_id" integer
     */
    addColumn: 'ADD COLUMN',

    /**
     * example:
     *  DO $$ BEGIN
     *   ALTER TABLE "pages_blocks_my_block" ADD CONSTRAINT "pages_blocks_my_block_person_id_users_id_fk" FOREIGN KEY ("person_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
     *  EXCEPTION
     *   WHEN duplicate_object THEN null;
     *  END $$;
     */
    addConstraint: 'ADD CONSTRAINT',

    /**
     * example: CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
     *  "id" serial PRIMARY KEY NOT NULL,
     *  "global_slug" varchar,
     *  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     *  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
     * );
     */
    createTable: 'CREATE TABLE',

    /**
     * example: ALTER TABLE "_posts_v_rels" DROP COLUMN IF EXISTS "posts_id";
     */
    dropColumn: 'DROP COLUMN',

    /**
     * example: ALTER TABLE "_posts_v_rels" DROP CONSTRAINT "_posts_v_rels_posts_fk";
     */
    dropConstraint: 'DROP CONSTRAINT',

    /**
     * example: DROP TABLE "pages_rels";
     */
    dropTable: 'DROP TABLE',

    /**
     * example: ALTER TABLE "pages_blocks_my_block" ALTER COLUMN "person_id" SET NOT NULL;
     */
    notNull: 'NOT NULL',

    /**
     * example: CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('en', 'es');
     */
    createType: 'CREATE TYPE',

    /**
     * example: ALTER TYPE "public"."enum_pages_blocks_cta" ADD VALUE 'copy';
     */
    alterType: 'ALTER TYPE',

    /**
     * example: ALTER TABLE "categories_rels" DISABLE ROW LEVEL SECURITY;
     */
    disableRowSecurity: 'DISABLE ROW LEVEL SECURITY;',

    /**
     * example: DROP INDEX IF EXISTS "pages_title_idx";
     */
    dropIndex: 'DROP INDEX IF EXISTS',

    /**
     * example: ALTER TABLE "pages" ALTER COLUMN "_status" SET DEFAULT 'draft';
     */
    setDefault: 'SET DEFAULT',

    /**
     * example: CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
     */
    createIndex: 'INDEX IF NOT EXISTS',

    /**
     * example: DROP TYPE "public"."enum__pages_v_published_locale";
     */
    dropType: 'DROP TYPE',

    /**
     * columns were renamed from camelCase to snake_case
     * example: ALTER TABLE "forms" RENAME COLUMN "confirmationType" TO "confirmation_type";
     */
    renameColumn: 'RENAME COLUMN',
  }

  const result = Object.keys(groups).reduce((result, group: Groups) => {
    result[group] = []
    return result
  }, {}) as Record<Groups, string[]>

  // push multi-line changes to a single grouping
  let isCreateTable = false

  for (const line of list) {
    if (isCreateTable) {
      result.createTable.push(line)
      if (line.includes(');')) {
        isCreateTable = false
      }
      continue
    }
    Object.entries(groups).some(([key, value]) => {
      if (line.endsWith('NOT NULL;')) {
        // split up the ADD COLUMN and ALTER COLUMN NOT NULL statements
        // example: ALTER TABLE "pages_blocks_my_block" ADD COLUMN "person_id" integer NOT NULL;
        // becomes two separate statements:
        //  1. ALTER TABLE "pages_blocks_my_block" ADD COLUMN "person_id" integer;
        //  2.  ALTER TABLE "pages_blocks_my_block" ALTER COLUMN "person_id" SET NOT NULL;
        result.addColumn.push(line.replace(' NOT NULL;', ';'))
        result.notNull.push(convertAddColumnToAlterColumn(line))
        return true
      }
      if (line.includes(value)) {
        let statement = line
        if (key === 'dropConstraint') {
          statement = line.replace('" DROP CONSTRAINT "', '" DROP CONSTRAINT IF EXISTS "')
        }
        result[key].push(statement)
        return true
      }
    })
  }

  return result
}
