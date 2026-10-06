const client = { find: (options: unknown) => options }
client.find({ draft: true })
const data = { draft: true, publishAllLocales: true }
