// Every call below is a Local API call the transform cannot safely rewrite.
// Each one must be reported with its file and line instead of being skipped silently.

const spread = await payload.find({
  ...baseArgs,
  collection: 'posts',
})

const castSpread = await req.payload.update({
  ...baseArgs,
} as UpdateArgs)

const forwarded = await payload.findByID(args)

const built = await payload.count(buildArgs())

const queued = await payload.jobs.queue(jobArgs)

// Already explicit despite the spread: nothing to report.
const explicit = await payload.find({
  ...baseArgs,
  overrideAccess: false,
})
