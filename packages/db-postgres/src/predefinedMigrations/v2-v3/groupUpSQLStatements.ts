export type Groups =
  | 'addColumn'
  | 'addConstraint'
  | 'dropColumn'
  | 'dropConstraint'
  | 'dropTable'
  | 'notNull'

export const groupUpSQLStatements = (list: string[]): Record<Groups, string[]> => {
  const groups = {
    addColumn: 'ADD COLUMN',
    // example: ALTER TABLE "posts" ADD COLUMN "category_id" integer

    addConstraint: 'ADD CONSTRAINT',
    //example: ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE cascade ON UPDATE no action;

    dropColumn: 'DROP COLUMN',
    // example: ALTER TABLE "_posts_v_rels" DROP COLUMN IF EXISTS "posts_id";

    dropConstraint: 'DROP CONSTRAINT',
    // example: ALTER TABLE "_posts_v_rels" DROP CONSTRAINT "_posts_v_rels_posts_fk";

    dropTable: 'DROP TABLE',
    // example: DROP TABLE "pages_rels";

    notNull: 'NOT NULL',
  }

  const result = Object.keys(groups).reduce((result, group: Groups) => {
    return (result[group] = [])
  }, {}) as Record<Groups, string[]>

  for (const line of list) {
    Object.entries(groups).some(([key, value]) => {
      // example: ALTER TABLE "pages_blocks_my_block" ADD COLUMN "person_id" integer NOT NULL;
      if (line.endsWith('NOT NULL;')) {
        result[key].push(line.replace('NOT NULL;', ''))
        result.notNull.push(line.replace('ADD COLUMN', 'ALTER COLUMN'))
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

// -- drop tables
// DROP TABLE "pages_rels";
// DROP TABLE "categories_rels";
// DROP TABLE "_categories_v_rels";

// -- drop constraints

// ALTER TABLE "_posts_v_rels" DROP CONSTRAINT "_posts_v_rels_posts_fk";
//
// ALTER TABLE "pages_blocks_my_block" ADD COLUMN "person_id" integer NOT NULL;
// ALTER TABLE "pages_array" ADD COLUMN "people_id" integer;
// ALTER TABLE "posts" ADD COLUMN "category_id" integer;
// ALTER TABLE "_posts_v" ADD COLUMN "parent_id" integer;
// ALTER TABLE "_posts_v" ADD COLUMN "version_category_id" integer;
// ALTER TABLE "categories" ADD COLUMN "owner_id" integer;
// ALTER TABLE "_categories_v" ADD COLUMN "parent_id" integer;
// ALTER TABLE "_categories_v" ADD COLUMN "version_owner_id" integer;
// DO $$ BEGIN
//  ALTER TABLE "pages_blocks_my_block" ADD CONSTRAINT "pages_blocks_my_block_person_id_users_id_fk" FOREIGN KEY ("person_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
// EXCEPTION
//  WHEN duplicate_object THEN null;
// END $$;
//
// DO $$ BEGIN
//  ALTER TABLE "pages_array" ADD CONSTRAINT "pages_array_people_id_users_id_fk" FOREIGN KEY ("people_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
// EXCEPTION
//  WHEN duplicate_object THEN null;
// END $$;
//
// DO $$ BEGIN
//  ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE cascade ON UPDATE no action;
// EXCEPTION
//  WHEN duplicate_object THEN null;
// END $$;
//
// DO $$ BEGIN
//  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "posts"("id") ON DELETE cascade ON UPDATE no action;
// EXCEPTION
//  WHEN duplicate_object THEN null;
// END $$;
//
// DO $$ BEGIN
//  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "categories"("id") ON DELETE cascade ON UPDATE no action;
// EXCEPTION
//  WHEN duplicate_object THEN null;
// END $$;
//
// DO $$ BEGIN
//  ALTER TABLE "categories" ADD CONSTRAINT "categories_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
// EXCEPTION
//  WHEN duplicate_object THEN null;
// END $$;
//
// DO $$ BEGIN
//  ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE cascade ON UPDATE no action;
// EXCEPTION
//  WHEN duplicate_object THEN null;
// END $$;
//
// DO $$ BEGIN
//  ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_owner_id_users_id_fk" FOREIGN KEY ("version_owner_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
// EXCEPTION
//  WHEN duplicate_object THEN null;
// END $$;
//
// ALTER TABLE "_posts_v_rels" DROP COLUMN IF EXISTS "posts_id";`)
