// A single-line object should stay on one line rather than being split open.
const posts = await payload.find({ collection: 'posts' })

// Trailing comma on one line.
const one = await payload.findByID({ id, collection: 'posts', })

// An empty argument object.
const all = await payload.find({})
