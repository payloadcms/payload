# JSON Relationship Roundtrip Follow-up Design

## Goal

Finish PR #17512 so JSON exports containing dangling `hasMany` relationships can be imported successfully, while keeping CSV behavior and existing non-polymorphic preview behavior unchanged.

## Export and import behavior

JSON export will continue preserving unresolved `hasMany` entries as `null`. This retains the source array positions and matches the index-pinning behavior already used by CSV exports.

Before JSON relationship data reaches Payload validation, the import field hook will remove bare `null` entries from every `hasMany` relationship or upload array. Both monomorphic arrays of IDs and polymorphic arrays of `{ relationTo, value }` pairs use this normalization. Single relationships remain unchanged: a dangling single relationship may still be represented by a field-level `null`, which Payload already accepts.

This division keeps export fidelity without asking Payload to persist a relationship to a deleted document. CSV import continues using its existing unflattening behavior.

## Import preview behavior

The grouped `RelationshipCell` renderer will be used only when all of the following are true:

- the uploaded file is JSON;
- the field is a relationship field; and
- the field is polymorphic.

CSV previews, monomorphic relationships, and upload fields retain the previous rendering path. This prevents the new per-collection grouping and three-item cap from changing preview behavior beyond the PR's stated scope.

## Repository conventions

New and modified helpers will use object parameters. The collection-label boolean will be renamed to `shouldShowCollectionLabels`. The relationship roundtrip tests will share focused helpers for export creation, import creation, and resource tracking.

## Test isolation

The relationship roundtrip suite will track every page title, post ID, import ID, and export ID it creates. `afterEach` will delete those records so both successful and failed tests leave the database clean. Deleting import and export records will also exercise their upload cleanup hooks; no test-created file should be left behind.

## Verification

Tests will be added before implementation and observed failing for the expected reasons. Coverage will include:

- unit tests showing JSON import hooks remove bare `null` entries from monomorphic and polymorphic `hasMany` relationships;
- an integration roundtrip containing a deleted relationship target;
- preview tests proving grouping remains available for JSON polymorphic values while other preview paths retain their prior behavior;
- the existing plugin unit tests, integration suite, lint, and package type build.

