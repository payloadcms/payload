/**
 * Gets all existing migrations from the database, excluding the dev migration
 */ export async function getMigrations({ payload }) {
    const migrationQuery = await payload.find({
        collection: 'payload-migrations',
        limit: 0,
        sort: [
            '-batch',
            '-name'
        ],
        where: {
            batch: {
                not_equals: -1
            }
        }
    });
    const existingMigrations = migrationQuery.docs;
    // Get the highest batch number from existing migrations
    const latestBatch = Number(existingMigrations?.[0]?.batch) || 0;
    return {
        existingMigrations,
        latestBatch
    };
}

//# sourceMappingURL=getMigrations.js.map