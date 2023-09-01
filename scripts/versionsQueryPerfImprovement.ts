const payload = require('payload');

require('dotenv').config();

const { PAYLOAD_SECRET, MONGODB_URI } = process.env;

// This function ensures that there is at least one corresponding version for any document
// within each of your draft-enabled collections.

const improveVersionsQueryPerformance = async () => {
  // Initialize Payload
  // IMPORTANT: make sure your ENV variables are filled properly here
  // as the below variable names are just for reference.
  await payload.init({
    secret: PAYLOAD_SECRET,
    mongoURL: MONGODB_URI,
    local: true,
  });


  // For each collection
  await Promise.all(
    payload.config.collections.map(async ({ slug, versions }) => {
      if (versions) {
        const VersionsModel = payload.versions[slug];

        const newestDocs = VersionsModel.aggregate([
          // Sort so that newest are first
          { $sort: { updatedAt: -1 } },
          // Group by parent ID, and take the first of each
          {
            $group: {
              _id: '$parent',
              _versionID: { $first: '$_id' },
              version: { $first: '$version' },
              updatedAt: { $first: '$updatedAt' },
              createdAt: { $first: '$createdAt' },
            },
          },
        ], {
          allowDiskUse: true,
        })
          .exec();

        const newestDocIds = newestDocs.map((doc) => doc._versionID);

        await VersionsModel.updateMany({
          _id: {
            $in: newestDocIds,
          },
        }, {
          latest: true,
        });

        const newVersions = await VersionsModel.find({
          latest: {
            $eq: true,
          },
        });
      }
    }),
  );

  // For each global
  await Promise.all(
    payload.config.globals.map(async ({ slug, versions }) => {
      if (versions) {
        const VersionsModel = payload.versions[slug];

        await VersionsModel.findOneAndUpdate(
          {},
          { latest: true },
          {
            sort: { updatedAt: -1 },
            new: true,
          },
        ).exec();
      }
    }),
  );

  console.log('Done!');
  process.exit(0);
};

improveVersionsQueryPerformance();
