import { jobsCollectionSlug } from '../queues/config/collection.js';
export const defaultUpdateJobs = async function updateMany({ id, data, limit, req, returning, where }) {
    const updatedJobs = [];
    const jobsToUpdate = (id ? [
        await this.findOne({
            collection: jobsCollectionSlug,
            req,
            where: {
                id: {
                    equals: id
                }
            }
        })
    ] : (await this.find({
        collection: jobsCollectionSlug,
        limit,
        pagination: false,
        req,
        where
    })).docs).filter(Boolean);
    if (!jobsToUpdate) {
        return null;
    }
    for (const job of jobsToUpdate){
        const updateData = {
            ...job,
            ...data
        };
        const updatedJob = await this.updateOne({
            id: job.id,
            collection: jobsCollectionSlug,
            data: updateData,
            req,
            returning
        });
        updatedJobs.push(updatedJob);
    }
    return updatedJobs;
};

//# sourceMappingURL=defaultUpdateJobs.js.map