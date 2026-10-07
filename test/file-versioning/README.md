# SQL upgrade fixture

`FILE_VERSIONING_LEGACY_SCHEMA=true` selects a collection with the pre-versioning upload columns. Set `FILE_VERSIONING_MIGRATION_DIR` to a temporary directory inside the repository to enable `push: false`; set `PAYLOAD_DATABASE` to `sqlite` or `postgres` and point `SQLITE_URL` or `POSTGRES_URL` at a dedicated test database.

Generate and apply a `legacy` migration, insert a media row and version row, then unset `FILE_VERSIONING_LEGACY_SCHEMA`. Generate and apply an `add-original` migration with the same migration directory. Check that the new `original_*` columns on the current table and `version_original_*` columns on the version table, are nullable and that the old rows remain intact.

This exercises the same `migrate:create` and `migrate` commands a project uses with `push: false`. Keep these generated migrations in the temporary directory because each project's upload tables are determined by its config.

## Reference lookup indexes

Original filenames have a non-unique index on the current upload table and its version table. Stored variant filenames already have non-unique indexes. Generate a migration from a schema snapshot without the original-filename indexes, then from the updated config. The second migration should only create those indexes; its down migration should only drop them. Apply both directions against the dedicated test database and verify saved rows remain intact.

Cleanup queries use the stored variant fields in the sanitized schema, including fields retained after transformer configuration changes. If a candidate variant's field was removed from that schema, cleanup retains the object because it cannot prove the absence of historical references. Migrate its saved location data or handle those remaining objects explicitly. The integration suite exercises both retained schema fields and this conservative fallback.
