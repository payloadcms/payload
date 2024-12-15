import { relations, sql } from '@payloadcms/db-sqlite/drizzle'
import {
  foreignKey,
  index,
  integer,
  numeric,
  sqliteTable,
  text,
  uniqueIndex,
} from '@payloadcms/db-sqlite/drizzle/sqlite-core'

export const posts_blocks_block = sqliteTable(
  'posts_blocks_block',
  {
    _order: integer('_order').notNull(),
    _parentID: integer('_parent_id').notNull(),
    _path: text('_path').notNull(),
    id: text('id').primaryKey(),
    relationField: integer('relation_field_id').references(() => relation.id, {
      onDelete: 'set null',
    }),
    blockName: text('block_name'),
  },
  (columns) => ({
    _orderIdx: index('posts_blocks_block_order_idx').on(columns['_order']),
    _parentIDIdx: index('posts_blocks_block_parent_id_idx').on(columns['_parentID']),
    _pathIdx: index('posts_blocks_block_path_idx').on(columns['_path']),
    posts_blocks_block_relation_field_idx: index('posts_blocks_block_relation_field_idx').on(
      columns['relationField'],
    ),
    _parentIdFk: foreignKey({
      columns: [columns['_parentID']],
      foreignColumns: [posts['id']],
      name: 'posts_blocks_block_parent_id_fk',
    }).onDelete('cascade'),
  }),
)

export const posts = sqliteTable(
  'posts',
  {
    id: integer('id').primaryKey(),
    title: text('title'),
    description: text('description'),
    number: numeric('number'),
    relationField: integer('relation_field_id').references(() => relation.id, {
      onDelete: 'set null',
    }),
    defaultAccessRelation: integer('default_access_relation_id').references(
      () => strict_access.id,
      {
        onDelete: 'set null',
      },
    ),
    chainedRelation: integer('chained_relation_id').references(() => chained.id, {
      onDelete: 'set null',
    }),
    maxDepthRelation: integer('max_depth_relation_id').references(() => relation.id, {
      onDelete: 'set null',
    }),
    customIdRelation: text('custom_id_relation_id').references(() => custom_id.id, {
      onDelete: 'set null',
    }),
    customIdNumberRelation: numeric('custom_id_number_relation_id').references(
      () => custom_id_number.id,
      {
        onDelete: 'set null',
      },
    ),
    filteredRelation: integer('filtered_relation_id').references(() => relation.id, {
      onDelete: 'set null',
    }),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    posts_relation_field_idx: index('posts_relation_field_idx').on(columns['relationField']),
    posts_default_access_relation_idx: index('posts_default_access_relation_idx').on(
      columns['defaultAccessRelation'],
    ),
    posts_chained_relation_idx: index('posts_chained_relation_idx').on(columns['chainedRelation']),
    posts_max_depth_relation_idx: index('posts_max_depth_relation_idx').on(
      columns['maxDepthRelation'],
    ),
    posts_custom_id_relation_idx: index('posts_custom_id_relation_idx').on(
      columns['customIdRelation'],
    ),
    posts_custom_id_number_relation_idx: index('posts_custom_id_number_relation_idx').on(
      columns['customIdNumberRelation'],
    ),
    posts_filtered_relation_idx: index('posts_filtered_relation_idx').on(
      columns['filteredRelation'],
    ),
    posts_updated_at_idx: index('posts_updated_at_idx').on(columns['updatedAt']),
    posts_created_at_idx: index('posts_created_at_idx').on(columns['createdAt']),
  }),
)

export const posts_localized = sqliteTable(
  'posts_localized',
  {
    id: integer('id').primaryKey(),
    title: text('title'),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    posts_localized_updated_at_idx: index('posts_localized_updated_at_idx').on(
      columns['updatedAt'],
    ),
    posts_localized_created_at_idx: index('posts_localized_created_at_idx').on(
      columns['createdAt'],
    ),
  }),
)

export const posts_localized_locales = sqliteTable(
  'posts_localized_locales',
  {
    relationField: integer('relation_field_id').references(() => relation.id, {
      onDelete: 'set null',
    }),
    id: integer('id').primaryKey(),
    _locale: text('_locale', { enum: ['en', 'de'] }).notNull(),
    _parentID: integer('_parent_id').notNull(),
  },
  (columns) => ({
    posts_localized_relation_field_idx: index('posts_localized_relation_field_idx').on(
      columns['relationField'],
      columns['_locale'],
    ),
    _localeParent: uniqueIndex('posts_localized_locales_locale_parent_id_unique').on(
      columns['_locale'],
      columns['_parentID'],
    ),
    _parentIdFk: foreignKey({
      columns: [columns['_parentID']],
      foreignColumns: [posts_localized['id']],
      name: 'posts_localized_locales_parent_id_fk',
    }).onDelete('cascade'),
  }),
)

export const relation = sqliteTable(
  'relation',
  {
    id: integer('id').primaryKey(),
    name: text('name'),
    disableRelation: integer('disable_relation', { mode: 'boolean' }).notNull().default(false),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    relation_updated_at_idx: index('relation_updated_at_idx').on(columns['updatedAt']),
    relation_created_at_idx: index('relation_created_at_idx').on(columns['createdAt']),
  }),
)

export const strict_access = sqliteTable(
  'strict_access',
  {
    id: integer('id').primaryKey(),
    name: text('name'),
    disableRelation: integer('disable_relation', { mode: 'boolean' }).notNull().default(false),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    strict_access_updated_at_idx: index('strict_access_updated_at_idx').on(columns['updatedAt']),
    strict_access_created_at_idx: index('strict_access_created_at_idx').on(columns['createdAt']),
  }),
)

export const chained = sqliteTable(
  'chained',
  {
    id: integer('id').primaryKey(),
    name: text('name'),
    relation: integer('relation_id').references(() => chained.id, {
      onDelete: 'set null',
    }),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    chained_relation_idx: index('chained_relation_idx').on(columns['relation']),
    chained_updated_at_idx: index('chained_updated_at_idx').on(columns['updatedAt']),
    chained_created_at_idx: index('chained_created_at_idx').on(columns['createdAt']),
  }),
)

export const custom_id = sqliteTable(
  'custom_id',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    custom_id_updated_at_idx: index('custom_id_updated_at_idx').on(columns['updatedAt']),
    custom_id_created_at_idx: index('custom_id_created_at_idx').on(columns['createdAt']),
  }),
)

export const custom_id_number = sqliteTable(
  'custom_id_number',
  {
    id: numeric('id').primaryKey(),
    name: text('name'),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    custom_id_number_updated_at_idx: index('custom_id_number_updated_at_idx').on(
      columns['updatedAt'],
    ),
    custom_id_number_created_at_idx: index('custom_id_number_created_at_idx').on(
      columns['createdAt'],
    ),
  }),
)

export const screenings = sqliteTable(
  'screenings',
  {
    id: integer('id').primaryKey(),
    name: text('name'),
    movie: integer('movie_id').references(() => movies.id, {
      onDelete: 'set null',
    }),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    screenings_movie_idx: index('screenings_movie_idx').on(columns['movie']),
    screenings_updated_at_idx: index('screenings_updated_at_idx').on(columns['updatedAt']),
    screenings_created_at_idx: index('screenings_created_at_idx').on(columns['createdAt']),
  }),
)

export const movies = sqliteTable(
  'movies',
  {
    id: integer('id').primaryKey(),
    name: text('name'),
    director: integer('director_id').references(() => directors.id, {
      onDelete: 'set null',
    }),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    movies_director_idx: index('movies_director_idx').on(columns['director']),
    movies_updated_at_idx: index('movies_updated_at_idx').on(columns['updatedAt']),
    movies_created_at_idx: index('movies_created_at_idx').on(columns['createdAt']),
  }),
)

export const directors = sqliteTable(
  'directors',
  {
    id: integer('id').primaryKey(),
    name: text('name'),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    directors_updated_at_idx: index('directors_updated_at_idx').on(columns['updatedAt']),
    directors_created_at_idx: index('directors_created_at_idx').on(columns['createdAt']),
  }),
)

export const directors_rels = sqliteTable(
  'directors_rels',
  {
    id: integer('id').primaryKey(),
    order: integer('order'),
    parent: integer('parent_id').notNull(),
    path: text('path').notNull(),
    moviesID: integer('movies_id'),
  },
  (columns) => ({
    order: index('directors_rels_order_idx').on(columns['order']),
    parentIdx: index('directors_rels_parent_idx').on(columns['parent']),
    pathIdx: index('directors_rels_path_idx').on(columns['path']),
    directors_rels_movies_id_idx: index('directors_rels_movies_id_idx').on(columns['moviesID']),
    parentFk: foreignKey({
      columns: [columns['parent']],
      foreignColumns: [directors['id']],
      name: 'directors_rels_parent_fk',
    }).onDelete('cascade'),
    moviesIdFk: foreignKey({
      columns: [columns['moviesID']],
      foreignColumns: [movies['id']],
      name: 'directors_rels_movies_fk',
    }).onDelete('cascade'),
  }),
)

export const movie_reviews = sqliteTable(
  'movie_reviews',
  {
    id: integer('id').primaryKey(),
    movieReviewer: integer('movie_reviewer_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'set null',
      }),
    visibility: text('visibility', { enum: ['followers', 'public'] }).notNull(),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    movie_reviews_movie_reviewer_idx: index('movie_reviews_movie_reviewer_idx').on(
      columns['movieReviewer'],
    ),
    movie_reviews_updated_at_idx: index('movie_reviews_updated_at_idx').on(columns['updatedAt']),
    movie_reviews_created_at_idx: index('movie_reviews_created_at_idx').on(columns['createdAt']),
  }),
)

export const movie_reviews_rels = sqliteTable(
  'movie_reviews_rels',
  {
    id: integer('id').primaryKey(),
    order: integer('order'),
    parent: integer('parent_id').notNull(),
    path: text('path').notNull(),
    usersID: integer('users_id'),
  },
  (columns) => ({
    order: index('movie_reviews_rels_order_idx').on(columns['order']),
    parentIdx: index('movie_reviews_rels_parent_idx').on(columns['parent']),
    pathIdx: index('movie_reviews_rels_path_idx').on(columns['path']),
    movie_reviews_rels_users_id_idx: index('movie_reviews_rels_users_id_idx').on(
      columns['usersID'],
    ),
    parentFk: foreignKey({
      columns: [columns['parent']],
      foreignColumns: [movie_reviews['id']],
      name: 'movie_reviews_rels_parent_fk',
    }).onDelete('cascade'),
    usersIdFk: foreignKey({
      columns: [columns['usersID']],
      foreignColumns: [users['id']],
      name: 'movie_reviews_rels_users_fk',
    }).onDelete('cascade'),
  }),
)

export const polymorphic_relationships = sqliteTable(
  'polymorphic_relationships',
  {
    id: integer('id').primaryKey(),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    polymorphic_relationships_updated_at_idx: index('polymorphic_relationships_updated_at_idx').on(
      columns['updatedAt'],
    ),
    polymorphic_relationships_created_at_idx: index('polymorphic_relationships_created_at_idx').on(
      columns['createdAt'],
    ),
  }),
)

export const polymorphic_relationships_rels = sqliteTable(
  'polymorphic_relationships_rels',
  {
    id: integer('id').primaryKey(),
    order: integer('order'),
    parent: integer('parent_id').notNull(),
    path: text('path').notNull(),
    moviesID: integer('movies_id'),
  },
  (columns) => ({
    order: index('polymorphic_relationships_rels_order_idx').on(columns['order']),
    parentIdx: index('polymorphic_relationships_rels_parent_idx').on(columns['parent']),
    pathIdx: index('polymorphic_relationships_rels_path_idx').on(columns['path']),
    polymorphic_relationships_rels_movies_id_idx: index(
      'polymorphic_relationships_rels_movies_id_idx',
    ).on(columns['moviesID']),
    parentFk: foreignKey({
      columns: [columns['parent']],
      foreignColumns: [polymorphic_relationships['id']],
      name: 'polymorphic_relationships_rels_parent_fk',
    }).onDelete('cascade'),
    moviesIdFk: foreignKey({
      columns: [columns['moviesID']],
      foreignColumns: [movies['id']],
      name: 'polymorphic_relationships_rels_movies_fk',
    }).onDelete('cascade'),
  }),
)

export const tree = sqliteTable(
  'tree',
  {
    id: integer('id').primaryKey(),
    text: text('text'),
    parent: integer('parent_id').references(() => tree.id, {
      onDelete: 'set null',
    }),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    tree_parent_idx: index('tree_parent_idx').on(columns['parent']),
    tree_updated_at_idx: index('tree_updated_at_idx').on(columns['updatedAt']),
    tree_created_at_idx: index('tree_created_at_idx').on(columns['createdAt']),
  }),
)

export const pages_menu = sqliteTable(
  'pages_menu',
  {
    _order: integer('_order').notNull(),
    _parentID: integer('_parent_id').notNull(),
    id: text('id').primaryKey(),
    label: text('label'),
  },
  (columns) => ({
    _orderIdx: index('pages_menu_order_idx').on(columns['_order']),
    _parentIDIdx: index('pages_menu_parent_id_idx').on(columns['_parentID']),
    _parentIDFk: foreignKey({
      columns: [columns['_parentID']],
      foreignColumns: [pages['id']],
      name: 'pages_menu_parent_id_fk',
    }).onDelete('cascade'),
  }),
)

export const pages = sqliteTable(
  'pages',
  {
    id: integer('id').primaryKey(),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    pages_updated_at_idx: index('pages_updated_at_idx').on(columns['updatedAt']),
    pages_created_at_idx: index('pages_created_at_idx').on(columns['createdAt']),
  }),
)

export const rels_to_pages = sqliteTable(
  'rels_to_pages',
  {
    id: integer('id').primaryKey(),
    page: integer('page_id').references(() => pages.id, {
      onDelete: 'set null',
    }),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    rels_to_pages_page_idx: index('rels_to_pages_page_idx').on(columns['page']),
    rels_to_pages_updated_at_idx: index('rels_to_pages_updated_at_idx').on(columns['updatedAt']),
    rels_to_pages_created_at_idx: index('rels_to_pages_created_at_idx').on(columns['createdAt']),
  }),
)

export const rels_to_pages_and_custom_text_ids = sqliteTable(
  'rels_to_pages_and_custom_text_ids',
  {
    id: integer('id').primaryKey(),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    rels_to_pages_and_custom_text_ids_updated_at_idx: index(
      'rels_to_pages_and_custom_text_ids_updated_at_idx',
    ).on(columns['updatedAt']),
    rels_to_pages_and_custom_text_ids_created_at_idx: index(
      'rels_to_pages_and_custom_text_ids_created_at_idx',
    ).on(columns['createdAt']),
  }),
)

export const rels_to_pages_and_custom_text_ids_rels = sqliteTable(
  'rels_to_pages_and_custom_text_ids_rels',
  {
    id: integer('id').primaryKey(),
    order: integer('order'),
    parent: integer('parent_id').notNull(),
    path: text('path').notNull(),
    pagesID: integer('pages_id'),
    'custom-idID': text('custom_id_id'),
    'custom-id-numberID': numeric('custom_id_number_id'),
  },
  (columns) => ({
    order: index('rels_to_pages_and_custom_text_ids_rels_order_idx').on(columns['order']),
    parentIdx: index('rels_to_pages_and_custom_text_ids_rels_parent_idx').on(columns['parent']),
    pathIdx: index('rels_to_pages_and_custom_text_ids_rels_path_idx').on(columns['path']),
    rels_to_pages_and_custom_text_ids_rels_pages_id_idx: index(
      'rels_to_pages_and_custom_text_ids_rels_pages_id_idx',
    ).on(columns['pagesID']),
    rels_to_pages_and_custom_text_ids_rels_custom_id_id_idx: index(
      'rels_to_pages_and_custom_text_ids_rels_custom_id_id_idx',
    ).on(columns['custom-idID']),
    rels_to_pages_and_custom_text_ids_rels_custom_id_number_id_idx: index(
      'rels_to_pages_and_custom_text_ids_rels_custom_id_number_id_idx',
    ).on(columns['custom-id-numberID']),
    parentFk: foreignKey({
      columns: [columns['parent']],
      foreignColumns: [rels_to_pages_and_custom_text_ids['id']],
      name: 'rels_to_pages_and_custom_text_ids_rels_parent_fk',
    }).onDelete('cascade'),
    pagesIdFk: foreignKey({
      columns: [columns['pagesID']],
      foreignColumns: [pages['id']],
      name: 'rels_to_pages_and_custom_text_ids_rels_pages_fk',
    }).onDelete('cascade'),
    'custom-idIdFk': foreignKey({
      columns: [columns['custom-idID']],
      foreignColumns: [custom_id['id']],
      name: 'rels_to_pages_and_custom_text_ids_rels_custom_id_fk',
    }).onDelete('cascade'),
    'custom-id-numberIdFk': foreignKey({
      columns: [columns['custom-id-numberID']],
      foreignColumns: [custom_id_number['id']],
      name: 'rels_to_pages_and_custom_text_ids_rels_custom_id_number_fk',
    }).onDelete('cascade'),
  }),
)

export const object_writes = sqliteTable(
  'object_writes',
  {
    id: integer('id').primaryKey(),
    one: integer('one_id').references(() => movies.id, {
      onDelete: 'set null',
    }),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    object_writes_one_idx: index('object_writes_one_idx').on(columns['one']),
    object_writes_updated_at_idx: index('object_writes_updated_at_idx').on(columns['updatedAt']),
    object_writes_created_at_idx: index('object_writes_created_at_idx').on(columns['createdAt']),
  }),
)

export const object_writes_rels = sqliteTable(
  'object_writes_rels',
  {
    id: integer('id').primaryKey(),
    order: integer('order'),
    parent: integer('parent_id').notNull(),
    path: text('path').notNull(),
    moviesID: integer('movies_id'),
  },
  (columns) => ({
    order: index('object_writes_rels_order_idx').on(columns['order']),
    parentIdx: index('object_writes_rels_parent_idx').on(columns['parent']),
    pathIdx: index('object_writes_rels_path_idx').on(columns['path']),
    object_writes_rels_movies_id_idx: index('object_writes_rels_movies_id_idx').on(
      columns['moviesID'],
    ),
    parentFk: foreignKey({
      columns: [columns['parent']],
      foreignColumns: [object_writes['id']],
      name: 'object_writes_rels_parent_fk',
    }).onDelete('cascade'),
    moviesIdFk: foreignKey({
      columns: [columns['moviesID']],
      foreignColumns: [movies['id']],
      name: 'object_writes_rels_movies_fk',
    }).onDelete('cascade'),
  }),
)

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey(),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    email: text('email').notNull(),
    resetPasswordToken: text('reset_password_token'),
    resetPasswordExpiration: text('reset_password_expiration').default(
      sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
    ),
    salt: text('salt'),
    hash: text('hash'),
    loginAttempts: numeric('login_attempts').default('0'),
    lockUntil: text('lock_until').default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    users_updated_at_idx: index('users_updated_at_idx').on(columns['updatedAt']),
    users_created_at_idx: index('users_created_at_idx').on(columns['createdAt']),
    users_email_idx: uniqueIndex('users_email_idx').on(columns['email']),
  }),
)

export const payload_locked_documents = sqliteTable(
  'payload_locked_documents',
  {
    id: integer('id').primaryKey(),
    globalSlug: text('global_slug'),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    payload_locked_documents_global_slug_idx: index('payload_locked_documents_global_slug_idx').on(
      columns['globalSlug'],
    ),
    payload_locked_documents_updated_at_idx: index('payload_locked_documents_updated_at_idx').on(
      columns['updatedAt'],
    ),
    payload_locked_documents_created_at_idx: index('payload_locked_documents_created_at_idx').on(
      columns['createdAt'],
    ),
  }),
)

export const payload_locked_documents_rels = sqliteTable(
  'payload_locked_documents_rels',
  {
    id: integer('id').primaryKey(),
    order: integer('order'),
    parent: integer('parent_id').notNull(),
    path: text('path').notNull(),
    postsID: integer('posts_id'),
    postsLocalizedID: integer('posts_localized_id'),
    relationID: integer('relation_id'),
    'strict-accessID': integer('strict_access_id'),
    chainedID: integer('chained_id'),
    'custom-idID': text('custom_id_id'),
    'custom-id-numberID': numeric('custom_id_number_id'),
    screeningsID: integer('screenings_id'),
    moviesID: integer('movies_id'),
    directorsID: integer('directors_id'),
    movieReviewsID: integer('movie_reviews_id'),
    'polymorphic-relationshipsID': integer('polymorphic_relationships_id'),
    treeID: integer('tree_id'),
    pagesID: integer('pages_id'),
    'rels-to-pagesID': integer('rels_to_pages_id'),
    'rels-to-pages-and-custom-text-idsID': integer('rels_to_pages_and_custom_text_ids_id'),
    'object-writesID': integer('object_writes_id'),
    usersID: integer('users_id'),
  },
  (columns) => ({
    order: index('payload_locked_documents_rels_order_idx').on(columns['order']),
    parentIdx: index('payload_locked_documents_rels_parent_idx').on(columns['parent']),
    pathIdx: index('payload_locked_documents_rels_path_idx').on(columns['path']),
    payload_locked_documents_rels_posts_id_idx: index(
      'payload_locked_documents_rels_posts_id_idx',
    ).on(columns['postsID']),
    payload_locked_documents_rels_posts_localized_id_idx: index(
      'payload_locked_documents_rels_posts_localized_id_idx',
    ).on(columns['postsLocalizedID']),
    payload_locked_documents_rels_relation_id_idx: index(
      'payload_locked_documents_rels_relation_id_idx',
    ).on(columns['relationID']),
    payload_locked_documents_rels_strict_access_id_idx: index(
      'payload_locked_documents_rels_strict_access_id_idx',
    ).on(columns['strict-accessID']),
    payload_locked_documents_rels_chained_id_idx: index(
      'payload_locked_documents_rels_chained_id_idx',
    ).on(columns['chainedID']),
    payload_locked_documents_rels_custom_id_id_idx: index(
      'payload_locked_documents_rels_custom_id_id_idx',
    ).on(columns['custom-idID']),
    payload_locked_documents_rels_custom_id_number_id_idx: index(
      'payload_locked_documents_rels_custom_id_number_id_idx',
    ).on(columns['custom-id-numberID']),
    payload_locked_documents_rels_screenings_id_idx: index(
      'payload_locked_documents_rels_screenings_id_idx',
    ).on(columns['screeningsID']),
    payload_locked_documents_rels_movies_id_idx: index(
      'payload_locked_documents_rels_movies_id_idx',
    ).on(columns['moviesID']),
    payload_locked_documents_rels_directors_id_idx: index(
      'payload_locked_documents_rels_directors_id_idx',
    ).on(columns['directorsID']),
    payload_locked_documents_rels_movie_reviews_id_idx: index(
      'payload_locked_documents_rels_movie_reviews_id_idx',
    ).on(columns['movieReviewsID']),
    payload_locked_documents_rels_polymorphic_relationships_id_idx: index(
      'payload_locked_documents_rels_polymorphic_relationships_id_idx',
    ).on(columns['polymorphic-relationshipsID']),
    payload_locked_documents_rels_tree_id_idx: index(
      'payload_locked_documents_rels_tree_id_idx',
    ).on(columns['treeID']),
    payload_locked_documents_rels_pages_id_idx: index(
      'payload_locked_documents_rels_pages_id_idx',
    ).on(columns['pagesID']),
    payload_locked_documents_rels_rels_to_pages_id_idx: index(
      'payload_locked_documents_rels_rels_to_pages_id_idx',
    ).on(columns['rels-to-pagesID']),
    payload_locked_documents_rels_rels_to_pages_and_custom_text_ids_id_idx: index(
      'payload_locked_documents_rels_rels_to_pages_and_custom_text_ids_id_idx',
    ).on(columns['rels-to-pages-and-custom-text-idsID']),
    payload_locked_documents_rels_object_writes_id_idx: index(
      'payload_locked_documents_rels_object_writes_id_idx',
    ).on(columns['object-writesID']),
    payload_locked_documents_rels_users_id_idx: index(
      'payload_locked_documents_rels_users_id_idx',
    ).on(columns['usersID']),
    parentFk: foreignKey({
      columns: [columns['parent']],
      foreignColumns: [payload_locked_documents['id']],
      name: 'payload_locked_documents_rels_parent_fk',
    }).onDelete('cascade'),
    postsIdFk: foreignKey({
      columns: [columns['postsID']],
      foreignColumns: [posts['id']],
      name: 'payload_locked_documents_rels_posts_fk',
    }).onDelete('cascade'),
    postsLocalizedIdFk: foreignKey({
      columns: [columns['postsLocalizedID']],
      foreignColumns: [posts_localized['id']],
      name: 'payload_locked_documents_rels_posts_localized_fk',
    }).onDelete('cascade'),
    relationIdFk: foreignKey({
      columns: [columns['relationID']],
      foreignColumns: [relation['id']],
      name: 'payload_locked_documents_rels_relation_fk',
    }).onDelete('cascade'),
    'strict-accessIdFk': foreignKey({
      columns: [columns['strict-accessID']],
      foreignColumns: [strict_access['id']],
      name: 'payload_locked_documents_rels_strict_access_fk',
    }).onDelete('cascade'),
    chainedIdFk: foreignKey({
      columns: [columns['chainedID']],
      foreignColumns: [chained['id']],
      name: 'payload_locked_documents_rels_chained_fk',
    }).onDelete('cascade'),
    'custom-idIdFk': foreignKey({
      columns: [columns['custom-idID']],
      foreignColumns: [custom_id['id']],
      name: 'payload_locked_documents_rels_custom_id_fk',
    }).onDelete('cascade'),
    'custom-id-numberIdFk': foreignKey({
      columns: [columns['custom-id-numberID']],
      foreignColumns: [custom_id_number['id']],
      name: 'payload_locked_documents_rels_custom_id_number_fk',
    }).onDelete('cascade'),
    screeningsIdFk: foreignKey({
      columns: [columns['screeningsID']],
      foreignColumns: [screenings['id']],
      name: 'payload_locked_documents_rels_screenings_fk',
    }).onDelete('cascade'),
    moviesIdFk: foreignKey({
      columns: [columns['moviesID']],
      foreignColumns: [movies['id']],
      name: 'payload_locked_documents_rels_movies_fk',
    }).onDelete('cascade'),
    directorsIdFk: foreignKey({
      columns: [columns['directorsID']],
      foreignColumns: [directors['id']],
      name: 'payload_locked_documents_rels_directors_fk',
    }).onDelete('cascade'),
    movieReviewsIdFk: foreignKey({
      columns: [columns['movieReviewsID']],
      foreignColumns: [movie_reviews['id']],
      name: 'payload_locked_documents_rels_movie_reviews_fk',
    }).onDelete('cascade'),
    'polymorphic-relationshipsIdFk': foreignKey({
      columns: [columns['polymorphic-relationshipsID']],
      foreignColumns: [polymorphic_relationships['id']],
      name: 'payload_locked_documents_rels_polymorphic_relationships_fk',
    }).onDelete('cascade'),
    treeIdFk: foreignKey({
      columns: [columns['treeID']],
      foreignColumns: [tree['id']],
      name: 'payload_locked_documents_rels_tree_fk',
    }).onDelete('cascade'),
    pagesIdFk: foreignKey({
      columns: [columns['pagesID']],
      foreignColumns: [pages['id']],
      name: 'payload_locked_documents_rels_pages_fk',
    }).onDelete('cascade'),
    'rels-to-pagesIdFk': foreignKey({
      columns: [columns['rels-to-pagesID']],
      foreignColumns: [rels_to_pages['id']],
      name: 'payload_locked_documents_rels_rels_to_pages_fk',
    }).onDelete('cascade'),
    'rels-to-pages-and-custom-text-idsIdFk': foreignKey({
      columns: [columns['rels-to-pages-and-custom-text-idsID']],
      foreignColumns: [rels_to_pages_and_custom_text_ids['id']],
      name: 'payload_locked_documents_rels_rels_to_pages_and_custom_text_ids_fk',
    }).onDelete('cascade'),
    'object-writesIdFk': foreignKey({
      columns: [columns['object-writesID']],
      foreignColumns: [object_writes['id']],
      name: 'payload_locked_documents_rels_object_writes_fk',
    }).onDelete('cascade'),
    usersIdFk: foreignKey({
      columns: [columns['usersID']],
      foreignColumns: [users['id']],
      name: 'payload_locked_documents_rels_users_fk',
    }).onDelete('cascade'),
  }),
)

export const payload_preferences = sqliteTable(
  'payload_preferences',
  {
    id: integer('id').primaryKey(),
    key: text('key'),
    value: text('value', { mode: 'json' }),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    payload_preferences_key_idx: index('payload_preferences_key_idx').on(columns['key']),
    payload_preferences_updated_at_idx: index('payload_preferences_updated_at_idx').on(
      columns['updatedAt'],
    ),
    payload_preferences_created_at_idx: index('payload_preferences_created_at_idx').on(
      columns['createdAt'],
    ),
  }),
)

export const payload_preferences_rels = sqliteTable(
  'payload_preferences_rels',
  {
    id: integer('id').primaryKey(),
    order: integer('order'),
    parent: integer('parent_id').notNull(),
    path: text('path').notNull(),
    usersID: integer('users_id'),
  },
  (columns) => ({
    order: index('payload_preferences_rels_order_idx').on(columns['order']),
    parentIdx: index('payload_preferences_rels_parent_idx').on(columns['parent']),
    pathIdx: index('payload_preferences_rels_path_idx').on(columns['path']),
    payload_preferences_rels_users_id_idx: index('payload_preferences_rels_users_id_idx').on(
      columns['usersID'],
    ),
    parentFk: foreignKey({
      columns: [columns['parent']],
      foreignColumns: [payload_preferences['id']],
      name: 'payload_preferences_rels_parent_fk',
    }).onDelete('cascade'),
    usersIdFk: foreignKey({
      columns: [columns['usersID']],
      foreignColumns: [users['id']],
      name: 'payload_preferences_rels_users_fk',
    }).onDelete('cascade'),
  }),
)

export const payload_migrations = sqliteTable(
  'payload_migrations',
  {
    id: integer('id').primaryKey(),
    name: text('name'),
    batch: numeric('batch'),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (columns) => ({
    payload_migrations_updated_at_idx: index('payload_migrations_updated_at_idx').on(
      columns['updatedAt'],
    ),
    payload_migrations_created_at_idx: index('payload_migrations_created_at_idx').on(
      columns['createdAt'],
    ),
  }),
)

export const relations_posts_blocks_block = relations(posts_blocks_block, ({ one, many }) => ({
  _parentID: one(posts, {
    fields: [posts_blocks_block['_parentID']],
    references: [posts['id']],
    relationName: '_blocks_block',
  }),
  relationField: one(relation, {
    fields: [posts_blocks_block['relationField']],
    references: [relation['id']],
    relationName: 'relationField',
  }),
}))
export const relations_posts = relations(posts, ({ one, many }) => ({
  relationField: one(relation, {
    fields: [posts['relationField']],
    references: [relation['id']],
    relationName: 'relationField',
  }),
  _blocks_block: many(posts_blocks_block, {
    relationName: '_blocks_block',
  }),
  defaultAccessRelation: one(strict_access, {
    fields: [posts['defaultAccessRelation']],
    references: [strict_access['id']],
    relationName: 'defaultAccessRelation',
  }),
  chainedRelation: one(chained, {
    fields: [posts['chainedRelation']],
    references: [chained['id']],
    relationName: 'chainedRelation',
  }),
  maxDepthRelation: one(relation, {
    fields: [posts['maxDepthRelation']],
    references: [relation['id']],
    relationName: 'maxDepthRelation',
  }),
  customIdRelation: one(custom_id, {
    fields: [posts['customIdRelation']],
    references: [custom_id['id']],
    relationName: 'customIdRelation',
  }),
  customIdNumberRelation: one(custom_id_number, {
    fields: [posts['customIdNumberRelation']],
    references: [custom_id_number['id']],
    relationName: 'customIdNumberRelation',
  }),
  filteredRelation: one(relation, {
    fields: [posts['filteredRelation']],
    references: [relation['id']],
    relationName: 'filteredRelation',
  }),
}))
export const relations_posts_localized_locales = relations(
  posts_localized_locales,
  ({ one, many }) => ({
    _parentID: one(posts_localized, {
      fields: [posts_localized_locales['_parentID']],
      references: [posts_localized['id']],
      relationName: '_locales',
    }),
    relationField: one(relation, {
      fields: [posts_localized_locales['relationField']],
      references: [relation['id']],
      relationName: 'relationField',
    }),
  }),
)
export const relations_posts_localized = relations(posts_localized, ({ one, many }) => ({
  _locales: many(posts_localized_locales, {
    relationName: '_locales',
  }),
}))
export const relations_relation = relations(relation, ({ one, many }) => ({}))
export const relations_strict_access = relations(strict_access, ({ one, many }) => ({}))
export const relations_chained = relations(chained, ({ one, many }) => ({
  relation: one(chained, {
    fields: [chained['relation']],
    references: [chained['id']],
    relationName: 'relation',
  }),
}))
export const relations_custom_id = relations(custom_id, ({ one, many }) => ({}))
export const relations_custom_id_number = relations(custom_id_number, ({ one, many }) => ({}))
export const relations_screenings = relations(screenings, ({ one, many }) => ({
  movie: one(movies, {
    fields: [screenings['movie']],
    references: [movies['id']],
    relationName: 'movie',
  }),
}))
export const relations_movies = relations(movies, ({ one, many }) => ({
  director: one(directors, {
    fields: [movies['director']],
    references: [directors['id']],
    relationName: 'director',
  }),
}))
export const relations_directors_rels = relations(directors_rels, ({ one, many }) => ({
  parent: one(directors, {
    fields: [directors_rels['parent']],
    references: [directors['id']],
    relationName: '_rels',
  }),
  moviesID: one(movies, {
    fields: [directors_rels['moviesID']],
    references: [movies['id']],
    relationName: 'movies',
  }),
}))
export const relations_directors = relations(directors, ({ one, many }) => ({
  _rels: many(directors_rels, {
    relationName: '_rels',
  }),
}))
export const relations_movie_reviews_rels = relations(movie_reviews_rels, ({ one, many }) => ({
  parent: one(movie_reviews, {
    fields: [movie_reviews_rels['parent']],
    references: [movie_reviews['id']],
    relationName: '_rels',
  }),
  usersID: one(users, {
    fields: [movie_reviews_rels['usersID']],
    references: [users['id']],
    relationName: 'users',
  }),
}))
export const relations_movie_reviews = relations(movie_reviews, ({ one, many }) => ({
  movieReviewer: one(users, {
    fields: [movie_reviews['movieReviewer']],
    references: [users['id']],
    relationName: 'movieReviewer',
  }),
  _rels: many(movie_reviews_rels, {
    relationName: '_rels',
  }),
}))
export const relations_polymorphic_relationships_rels = relations(
  polymorphic_relationships_rels,
  ({ one, many }) => ({
    parent: one(polymorphic_relationships, {
      fields: [polymorphic_relationships_rels['parent']],
      references: [polymorphic_relationships['id']],
      relationName: '_rels',
    }),
    moviesID: one(movies, {
      fields: [polymorphic_relationships_rels['moviesID']],
      references: [movies['id']],
      relationName: 'movies',
    }),
  }),
)
export const relations_polymorphic_relationships = relations(
  polymorphic_relationships,
  ({ one, many }) => ({
    _rels: many(polymorphic_relationships_rels, {
      relationName: '_rels',
    }),
  }),
)
export const relations_tree = relations(tree, ({ one, many }) => ({
  parent: one(tree, {
    fields: [tree['parent']],
    references: [tree['id']],
    relationName: 'parent',
  }),
}))
export const relations_pages_menu = relations(pages_menu, ({ one, many }) => ({
  _parentID: one(pages, {
    fields: [pages_menu['_parentID']],
    references: [pages['id']],
    relationName: 'menu',
  }),
}))
export const relations_pages = relations(pages, ({ one, many }) => ({
  menu: many(pages_menu, {
    relationName: 'menu',
  }),
}))
export const relations_rels_to_pages = relations(rels_to_pages, ({ one, many }) => ({
  page: one(pages, {
    fields: [rels_to_pages['page']],
    references: [pages['id']],
    relationName: 'page',
  }),
}))
export const relations_rels_to_pages_and_custom_text_ids_rels = relations(
  rels_to_pages_and_custom_text_ids_rels,
  ({ one, many }) => ({
    parent: one(rels_to_pages_and_custom_text_ids, {
      fields: [rels_to_pages_and_custom_text_ids_rels['parent']],
      references: [rels_to_pages_and_custom_text_ids['id']],
      relationName: '_rels',
    }),
    pagesID: one(pages, {
      fields: [rels_to_pages_and_custom_text_ids_rels['pagesID']],
      references: [pages['id']],
      relationName: 'pages',
    }),
    'custom-idID': one(custom_id, {
      fields: [rels_to_pages_and_custom_text_ids_rels['custom-idID']],
      references: [custom_id['id']],
      relationName: 'custom-id',
    }),
    'custom-id-numberID': one(custom_id_number, {
      fields: [rels_to_pages_and_custom_text_ids_rels['custom-id-numberID']],
      references: [custom_id_number['id']],
      relationName: 'custom-id-number',
    }),
  }),
)
export const relations_rels_to_pages_and_custom_text_ids = relations(
  rels_to_pages_and_custom_text_ids,
  ({ one, many }) => ({
    _rels: many(rels_to_pages_and_custom_text_ids_rels, {
      relationName: '_rels',
    }),
  }),
)
export const relations_object_writes_rels = relations(object_writes_rels, ({ one, many }) => ({
  parent: one(object_writes, {
    fields: [object_writes_rels['parent']],
    references: [object_writes['id']],
    relationName: '_rels',
  }),
  moviesID: one(movies, {
    fields: [object_writes_rels['moviesID']],
    references: [movies['id']],
    relationName: 'movies',
  }),
}))
export const relations_object_writes = relations(object_writes, ({ one, many }) => ({
  one: one(movies, {
    fields: [object_writes['one']],
    references: [movies['id']],
    relationName: 'one',
  }),
  _rels: many(object_writes_rels, {
    relationName: '_rels',
  }),
}))
export const relations_users = relations(users, ({ one, many }) => ({}))
export const relations_payload_locked_documents_rels = relations(
  payload_locked_documents_rels,
  ({ one, many }) => ({
    parent: one(payload_locked_documents, {
      fields: [payload_locked_documents_rels['parent']],
      references: [payload_locked_documents['id']],
      relationName: '_rels',
    }),
    postsID: one(posts, {
      fields: [payload_locked_documents_rels['postsID']],
      references: [posts['id']],
      relationName: 'posts',
    }),
    postsLocalizedID: one(posts_localized, {
      fields: [payload_locked_documents_rels['postsLocalizedID']],
      references: [posts_localized['id']],
      relationName: 'postsLocalized',
    }),
    relationID: one(relation, {
      fields: [payload_locked_documents_rels['relationID']],
      references: [relation['id']],
      relationName: 'relation',
    }),
    'strict-accessID': one(strict_access, {
      fields: [payload_locked_documents_rels['strict-accessID']],
      references: [strict_access['id']],
      relationName: 'strict-access',
    }),
    chainedID: one(chained, {
      fields: [payload_locked_documents_rels['chainedID']],
      references: [chained['id']],
      relationName: 'chained',
    }),
    'custom-idID': one(custom_id, {
      fields: [payload_locked_documents_rels['custom-idID']],
      references: [custom_id['id']],
      relationName: 'custom-id',
    }),
    'custom-id-numberID': one(custom_id_number, {
      fields: [payload_locked_documents_rels['custom-id-numberID']],
      references: [custom_id_number['id']],
      relationName: 'custom-id-number',
    }),
    screeningsID: one(screenings, {
      fields: [payload_locked_documents_rels['screeningsID']],
      references: [screenings['id']],
      relationName: 'screenings',
    }),
    moviesID: one(movies, {
      fields: [payload_locked_documents_rels['moviesID']],
      references: [movies['id']],
      relationName: 'movies',
    }),
    directorsID: one(directors, {
      fields: [payload_locked_documents_rels['directorsID']],
      references: [directors['id']],
      relationName: 'directors',
    }),
    movieReviewsID: one(movie_reviews, {
      fields: [payload_locked_documents_rels['movieReviewsID']],
      references: [movie_reviews['id']],
      relationName: 'movieReviews',
    }),
    'polymorphic-relationshipsID': one(polymorphic_relationships, {
      fields: [payload_locked_documents_rels['polymorphic-relationshipsID']],
      references: [polymorphic_relationships['id']],
      relationName: 'polymorphic-relationships',
    }),
    treeID: one(tree, {
      fields: [payload_locked_documents_rels['treeID']],
      references: [tree['id']],
      relationName: 'tree',
    }),
    pagesID: one(pages, {
      fields: [payload_locked_documents_rels['pagesID']],
      references: [pages['id']],
      relationName: 'pages',
    }),
    'rels-to-pagesID': one(rels_to_pages, {
      fields: [payload_locked_documents_rels['rels-to-pagesID']],
      references: [rels_to_pages['id']],
      relationName: 'rels-to-pages',
    }),
    'rels-to-pages-and-custom-text-idsID': one(rels_to_pages_and_custom_text_ids, {
      fields: [payload_locked_documents_rels['rels-to-pages-and-custom-text-idsID']],
      references: [rels_to_pages_and_custom_text_ids['id']],
      relationName: 'rels-to-pages-and-custom-text-ids',
    }),
    'object-writesID': one(object_writes, {
      fields: [payload_locked_documents_rels['object-writesID']],
      references: [object_writes['id']],
      relationName: 'object-writes',
    }),
    usersID: one(users, {
      fields: [payload_locked_documents_rels['usersID']],
      references: [users['id']],
      relationName: 'users',
    }),
  }),
)
export const relations_payload_locked_documents = relations(
  payload_locked_documents,
  ({ one, many }) => ({
    _rels: many(payload_locked_documents_rels, {
      relationName: '_rels',
    }),
  }),
)
export const relations_payload_preferences_rels = relations(
  payload_preferences_rels,
  ({ one, many }) => ({
    parent: one(payload_preferences, {
      fields: [payload_preferences_rels['parent']],
      references: [payload_preferences['id']],
      relationName: '_rels',
    }),
    usersID: one(users, {
      fields: [payload_preferences_rels['usersID']],
      references: [users['id']],
      relationName: 'users',
    }),
  }),
)
export const relations_payload_preferences = relations(payload_preferences, ({ one, many }) => ({
  _rels: many(payload_preferences_rels, {
    relationName: '_rels',
  }),
}))
export const relations_payload_migrations = relations(payload_migrations, ({ one, many }) => ({}))

type DatabaseSchema = {
  chained: typeof chained
  custom_id: typeof custom_id
  custom_id_number: typeof custom_id_number
  directors: typeof directors
  directors_rels: typeof directors_rels
  movie_reviews: typeof movie_reviews
  movie_reviews_rels: typeof movie_reviews_rels
  movies: typeof movies
  object_writes: typeof object_writes
  object_writes_rels: typeof object_writes_rels
  pages: typeof pages
  pages_menu: typeof pages_menu
  payload_locked_documents: typeof payload_locked_documents
  payload_locked_documents_rels: typeof payload_locked_documents_rels
  payload_migrations: typeof payload_migrations
  payload_preferences: typeof payload_preferences
  payload_preferences_rels: typeof payload_preferences_rels
  polymorphic_relationships: typeof polymorphic_relationships
  polymorphic_relationships_rels: typeof polymorphic_relationships_rels
  posts: typeof posts
  posts_blocks_block: typeof posts_blocks_block
  posts_localized: typeof posts_localized
  posts_localized_locales: typeof posts_localized_locales
  relation: typeof relation
  relations_chained: typeof relations_chained
  relations_custom_id: typeof relations_custom_id
  relations_custom_id_number: typeof relations_custom_id_number
  relations_directors: typeof relations_directors
  relations_directors_rels: typeof relations_directors_rels
  relations_movie_reviews: typeof relations_movie_reviews
  relations_movie_reviews_rels: typeof relations_movie_reviews_rels
  relations_movies: typeof relations_movies
  relations_object_writes: typeof relations_object_writes
  relations_object_writes_rels: typeof relations_object_writes_rels
  relations_pages: typeof relations_pages
  relations_pages_menu: typeof relations_pages_menu
  relations_payload_locked_documents: typeof relations_payload_locked_documents
  relations_payload_locked_documents_rels: typeof relations_payload_locked_documents_rels
  relations_payload_migrations: typeof relations_payload_migrations
  relations_payload_preferences: typeof relations_payload_preferences
  relations_payload_preferences_rels: typeof relations_payload_preferences_rels
  relations_polymorphic_relationships: typeof relations_polymorphic_relationships
  relations_polymorphic_relationships_rels: typeof relations_polymorphic_relationships_rels
  relations_posts: typeof relations_posts
  relations_posts_blocks_block: typeof relations_posts_blocks_block
  relations_posts_localized: typeof relations_posts_localized
  relations_posts_localized_locales: typeof relations_posts_localized_locales
  relations_relation: typeof relations_relation
  relations_rels_to_pages: typeof relations_rels_to_pages
  relations_rels_to_pages_and_custom_text_ids: typeof relations_rels_to_pages_and_custom_text_ids
  relations_rels_to_pages_and_custom_text_ids_rels: typeof relations_rels_to_pages_and_custom_text_ids_rels
  relations_screenings: typeof relations_screenings
  relations_strict_access: typeof relations_strict_access
  relations_tree: typeof relations_tree
  relations_users: typeof relations_users
  rels_to_pages: typeof rels_to_pages
  rels_to_pages_and_custom_text_ids: typeof rels_to_pages_and_custom_text_ids
  rels_to_pages_and_custom_text_ids_rels: typeof rels_to_pages_and_custom_text_ids_rels
  screenings: typeof screenings
  strict_access: typeof strict_access
  tree: typeof tree
  users: typeof users
}

declare module '@payloadcms/db-sqlite/types' {
  export interface GeneratedDatabaseSchema {
    schema: DatabaseSchema
  }
}
