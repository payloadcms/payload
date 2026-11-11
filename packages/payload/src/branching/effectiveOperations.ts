/**
 * What a change will actually do to `main` when merged, which is not always what
 * it did on the branch. Editing a published document on a branch is a `publish`
 * against main and needs publish permission; saving a draft on that same
 * document is an ordinary `update` that must leave main's published row alone.
 */
export type EffectiveOperation = 'create' | 'delete' | 'publish' | 'update'
