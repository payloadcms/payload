// A trailing comment after the last property previously caused a double comma.
const doc = await payload.findByID({
  id: first.id,
  collection,
  overrideAccess: true,
  // omitting req for isolation
})

const posts = await payload.find({
  collection: 'posts',
  overrideAccess: true,
  // no req on purpose
})
