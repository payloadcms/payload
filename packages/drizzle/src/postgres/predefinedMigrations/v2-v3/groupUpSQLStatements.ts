export type Groups =
  | 'addColumn'
  | 'addConstraint'
  | 'dropColumn'
  | 'dropConstraint'
  | 'dropTable'
  | 'notNull'

/**
 * Convert an "ADD COLUMN" statement to an "ALTER COLUMN" statement
 * example: ALTER TABLE "pages_blocks_my_block" ADD COLUMN "person_id" integer NOT NULL;
 * to: ALTER TABLE "pages_blocks_my_block" ALTER COLUMN "person_id" SET NOT NULL;
 * @param sql
 */
function convertAddColumnToAlterColumn(sql) {
  // Regular expression to match the ADD COLUMN statement with its constraints
  const regex = /ALTER TABLE ("[^"]+")\.(".*?") ADD COLUMN ("[^"]+") [\w\s]+ NOT NULL;/

  // Replace the matched part with "ALTER COLUMN ... SET NOT NULL;"
  return sql.replace(regex, 'ALTER TABLE $1.$2 ALTER COLUMN $3 SET NOT NULL;')
}

export const groupUpSQLStatements = (list: string[]): Record<Groups, string[]> => {
  const groups = {
    addColumn: 'ADD COLUMN',
    // example: ALTER TABLE "posts" ADD COLUMN "category_id" integer

    addConstraint: 'ADD CONSTRAINT',
    //example:
    // DO $$ BEGIN
    //  ALTER TABLE "pages_blocks_my_block" ADD CONSTRAINT "pages_blocks_my_block_person_id_users_id_fk" FOREIGN KEY ("person_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
    // EXCEPTION
    //  WHEN duplicate_object THEN null;
    // END $$;

    dropColumn: 'DROP COLUMN',
    // example: ALTER TABLE "_posts_v_rels" DROP COLUMN IF EXISTS "posts_id";

    dropConstraint: 'DROP CONSTRAINT',
    // example: ALTER TABLE "_posts_v_rels" DROP CONSTRAINT "_posts_v_rels_posts_fk";

    dropTable: 'DROP TABLE',
    // example: DROP TABLE "pages_rels";

    notNull: 'NOT NULL',
    // example: ALTER TABLE "pages_blocks_my_block" ALTER COLUMN "person_id" SET NOT NULL;
  }

  const result = Object.keys(groups).reduce((result, group: Groups) => {
    result[group] = []
    return result
  }, {}) as Record<Groups, string[]>

  for (const line of list) {
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
        result[key].push(line)
        return true
      }
    })
  }

  return result
}
