export async function aliasedReads(payload, sdk, req) {
  const fromReq = await req.payload.find({
    collection: 'posts',
    version: 'latest',
  })

  const fromSdk = await sdk.find({
    collection: 'posts',
    version: 'published',
  })

  const { findByID } = payload
  const byID = await findByID({
    id: '1',
    collection: 'posts',
    version: 'latest',
  })

  return { byID, fromReq, fromSdk }
}
