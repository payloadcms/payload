module.exports.up = `  async function migrateCollectionDocs(slug: string, docsAtATime = 100) {
    const VersionsModel = payload.db.versions[slug]
    const remainingDocs = await VersionsModel.aggregate(
      [
        // Sort so that newest are first
        {
          $sort: {
            updatedAt: -1,
          },
        },
        // Group by parent ID
        // take the $first of each
        {
          $group: {
            _id: '$parent',
            _versionID: { $first: '$_id' },
            createdAt: { $first: '$createdAt' },
            latest: { $first: '$latest' },
            updatedAt: { $first: '$updatedAt' },
            version: { $first: '$version' },
          },
        },
        {
          $match: {
            latest: { $eq: null },
          },
        },
        {
          $limit: docsAtATime,
        },
      ],
      {
        allowDiskUse: true,
      },
    ).exec()

    if (!remainingDocs || remainingDocs.length === 0) {
      const newVersions = await VersionsModel.find({
        latest: {
          $eq: true,
        },
      })

      if (newVersions?.length) {
        payload.logger.info(
          \`Migrated \${newVersions.length} documents in the "\${slug}" versions collection.\`,
        )
      }

      return
    }

    const remainingDocIds = remainingDocs.map((doc) => doc._versionID)

    await VersionsModel.updateMany(
      {
        _id: {
          $in: remainingDocIds,
        },
      },
      {
        latest: true,
      },
    )

    await migrateCollectionDocs(slug)
  }

  // For each collection
  await Promise.all(
    payload.config.collections.map(async ({ slug, versions }) => {
      if (versions?.drafts) {
        return migrateCollectionDocs(slug)
      }
    }),
  )

  // For each global
  await Promise.all(
    payload.config.globals.map(async ({ slug, versions }) => {
      if (versions) {
        const VersionsModel = payload.db.versions[slug]

        await VersionsModel.findOneAndUpdate(
          {},
          { latest: true },
          {
            sort: { updatedAt: -1 },
          },
        ).exec()

        payload.logger.info(\`Migrated the "\${slug}" global.\`)
      }
    }),
  )
`
