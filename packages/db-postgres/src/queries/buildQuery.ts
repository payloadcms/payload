import { Where } from 'payload/dist/types';
import { Field } from 'payload/dist/fields/config/types';
import { PgSelectQueryBuilder, PgTable } from 'drizzle-orm/pg-core';
import { SQL } from 'drizzle-orm';
import { parseParams } from './parseParams';
import { PostgresAdapter } from '../types';
import { traversePath } from './traverseFields';

export type BuildQueryJoins = Record<string, {
  table: PgTable<any>,
  condition: SQL,
}>

type BuildQueryArgs = {
  selectQuery: PgSelectQueryBuilder<any, any, any, any, any>
  joins: BuildQueryJoins
  adapter: PostgresAdapter
  where: Where
  locale?: string
  collectionSlug?: string
  globalSlug?: string
  versionsFields?: Field[]
  sort: string
}
const buildQuery = async function buildQuery({
  selectQuery,
  joins,
  adapter,
  where,
  locale,
  collectionSlug,
  globalSlug,
  versionsFields,
  sort,
}: BuildQueryArgs): Promise<SQL> {
  let fields = versionsFields;
  if (!fields) {
    if (globalSlug) {
      const globalConfig = adapter.payload.globals.config.find(({ slug }) => slug === globalSlug);
      fields = globalConfig.fields;
    }
    if (collectionSlug) {
      const collectionConfig = adapter.payload.collections[collectionSlug].config;
      fields = collectionConfig.fields;
    }
  }

  if (collectionSlug && sort) {
    traversePath({
      payload: adapter.payload,
      collectionSlug,
      fields,
      path: sort,
      joins,
    });
  }

  return parseParams({
    selectQuery,
    joins,
    collectionSlug,
    fields,
    globalSlug,
    adapter,
    locale,
    where,
    sort,
  });
};
  // const results = db.selectDistinct({ id: posts.id })
  //       .from(posts)
  //       .innerJoin(posts_locales, eq(posts.id, posts_locales._parentID))
  //       .innerJoin(posts_relationships, eq(posts.id, posts_relationships.parent))
  //       .where(eq(posts_locales.title, postTitleEN))
  //       .orderBy(posts_locales.title)
  //       .all()

export default buildQuery;
