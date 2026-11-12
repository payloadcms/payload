/**
 * Whether a file entry (the main file or one size) is built when it is requested. Such an entry
 * keeps its `filename` but has no object in storage, so file operations must not copy, rename,
 * delete or link to it as one. A missing or `null` `_stored` keeps the entry's existing handling.
 *
 * This does not prove that a stored object exists. `collectStoredFiles` decides that.
 */
export const isRequestTimeFile = ({ entry }: { entry?: { _stored?: unknown } | null }): boolean =>
  entry?._stored === false
