// A comment between two properties previously corrupted the preceding comma
// and placed the insert before the trailing property instead of at the end.
const doc = await payload.findByID({
  id,
  collection,
  req,
  // Include trashed documents when the document being synced is trashed
  trash: isTrashDocument,
  overrideAccess: true,
})
