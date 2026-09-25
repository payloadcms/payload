# SQL upgrade fixture

`FILE_VERSIONING_LEGACY_SCHEMA=true` selects a collection with the pre-versioning upload columns. Set `FILE_VERSIONING_MIGRATION_DIR` to a temporary directory inside the repository to enable `push: false`; set `PAYLOAD_DATABASE` to `sqlite` or `postgres` and point `SQLITE_URL` or `POSTGRES_URL` at a dedicated test database.

Generate and apply a `legacy` migration, insert a media row and version row, then unset `FILE_VERSIONING_LEGACY_SCHEMA`. Generate and apply an `add-original` migration with the same migration directory. Check that the new `original_*` and `_managedfiles` columns on the current table, and `version_original_*` and `version__managedfiles` columns on the version table, are nullable and that the old rows remain intact.

This exercises the same `migrate:create` and `migrate` commands a project uses with `push: false`. Keep these generated migrations in the temporary directory because each project's upload tables are determined by its config.
