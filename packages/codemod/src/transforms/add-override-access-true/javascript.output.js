// A JavaScript project has no tsconfig.json, so ts-morph has no type
// information. Detection must stay purely syntactic.

export const run = async (payload, req) => {
  const posts = await payload.find({
    collection: 'posts',
    overrideAccess: true,
  })

  const created = await req.payload.create({
    collection: 'posts',
    data: { title: 'hello' },
    overrideAccess: true,
  })

  const scoped = await payload.find({
    collection: 'posts',
    overrideAccess: false,
  })

  return { created, posts, scoped }
}
